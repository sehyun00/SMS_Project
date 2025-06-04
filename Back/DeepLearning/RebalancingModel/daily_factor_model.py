"""
Daily 5-Factor Stock Model
일별 5팩터 주식 모델 - 한국/미국 주식 분석 및 리밸런싱 신호 생성
"""

import pandas as pd
import numpy as np
import yfinance as yf
import pandas_market_calendars as mcal
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import warnings
import time
import os
from bs4 import BeautifulSoup
import requests
from sklearn.preprocessing import RobustScaler
from pykrx import stock

# GPU 라이브러리 추가 (선택사항)
try:
    import cupy as cp
    import cudf
    import cuml
    HAS_GPU = True
    print("GPU 라이브러리 로드 성공 - GPU 가속 사용 가능")
except ImportError:
    HAS_GPU = False
    print("GPU 라이브러리 사용 불가 - CPU 처리로 진행합니다")

# 경고 메시지 무시
warnings.filterwarnings('ignore')

class DailyStockFactorModel:
    def __init__(self, use_all_stocks=True, batch_size=50):
        print("일별 5팩터 모델 데이터 처리 시작")
        self.start_time = time.time()

        # 설정
        self.use_all_stocks = use_all_stocks  # True: 모든 주식, False: 테스트용 20개씩
        self.batch_size = batch_size         # 배치 처리 크기 (API 호출 제한 대응)

        # 현재 날짜 설정
        self.current_date = datetime.now()
        # 1년 전 날짜 계산
        self.one_year_ago = self.current_date - relativedelta(years=1)

        # 한국/미국 대표 주식 리스트
        self.kr_stocks = []
        self.us_stocks = []

        # 데이터 저장용 변수
        self.stock_data = {} # stock_data 속성 추가
        self.daily_dates = []
        self.factor_model_data = pd.DataFrame()

        # 기본 베타값 딕셔너리 (API에서 가져오지 못할 경우 사용)
        self.default_beta_values = {
            '005935.KS': 0.85, '051910.KS': 1.25, '006400.KS': 1.30,
            '035720.KS': 1.35, '028260.KS': 1.10, '066570.KS': 1.15,
            '032830.KS': 0.80, '000810.KS': 0.75, '009150.KS': 1.05,
            '018260.KS': 0.95, '017670.KS': 0.90, '034730.KS': 1.00,
            '003550.KS': 1.10, '036570.KS': 1.40, '015760.KS': 0.65,
            '259960.KS': 1.50, '009540.KS': 1.20, '005490.KS': 1.05,
            '055550.KS': 0.95, '323410.KS': 1.30, '316140.KS': 0.85,
            '086790.KS': 0.90, '097950.KS': 1.10, '030200.KS': 0.75,
            '003670.KS': 1.15, '096770.KS': 1.25, '000100.KS': 0.80,
            '033780.KS': 0.85, '138040.KS': 0.95, '139480.KS': 0.70,
            '000020.KS': 0.83
        }

        # 팩터 가중치 설정
        self.factor_weights = {
            'Beta_Factor': 0.20,
            'Value_Factor': 0.20,
            'Size_Factor': 0.20,
            'Momentum_Factor': 0.20,
            'Volatility_Factor': 0.20
        }

        print(f"설정: {'전체 주식 처리' if self.use_all_stocks else '테스트 모드 (20개씩)'}")
        print(f"배치 크기: {self.batch_size}")

    def get_exchange_rate_krw_to_usd(self):
        """KRW to USD 환율을 가져옵니다"""
        try:
            url = "https://api.exchangerate-api.com/v4/latest/USD"
            response = requests.get(url)
            data = response.json()

            usd_to_krw = data['rates']['KRW']
            krw_to_usd = 1 / usd_to_krw

            print(f"현재 환율: 1 USD = {usd_to_krw:.2f} KRW, 1 KRW = {krw_to_usd:.8f} USD")
            return krw_to_usd
        except Exception as e:
            print(f"환율 정보 가져오기 실패: {e}, 기본 환율 사용")
            return 0.00077

    def get_trading_days(self, start_date, end_date, market='KRX'):
        """특정 기간의 모든 거래일을 찾습니다"""
        try:
            # 해당 시장의 캘린더 생성
            if market == 'KRX':
                exchange = mcal.get_calendar('XKRX')
            else: # 미국 시장
                exchange = mcal.get_calendar('NYSE')

            # 해당 기간의 거래일 가져오기
            trading_days = exchange.valid_days(start_date=start_date, end_date=end_date)

            # 날짜 객체로 변환
            trading_days = [day.date() for day in trading_days]

            return trading_days
        except Exception as e:
            print(f"거래일 정보 가져오기 실패: {e}")
            return []

    def generate_daily_dates(self, market='KRX'):
        """지난 1년간의 모든 거래일 목록을 생성합니다"""
        start_date = self.one_year_ago.strftime('%Y-%m-%d')
        end_date = self.current_date.strftime('%Y-%m-%d')

        trading_days = self.get_trading_days(start_date, end_date, market)

        print(f"{market} 시장의 지난 1년간 거래일 {len(trading_days)}개 찾음")

        # 일별 날짜 저장
        self.daily_dates = trading_days
        return trading_days

    def get_korean_stocks(self, csv_path='../data/KR_Stock_Master.csv', limit=None):
        print("\n한국 대표 주식 가져오기...")
        # CSV 파일 로드
        df = pd.read_csv(csv_path, dtype={'Code': str})

        # 종목코드 6자리로 맞추기
        df['Code'] = df['Code'].str.zfill(6)

        # Market에 따라 suffix 붙이기
        def add_suffix(row):
            market = str(row['Market']).strip().upper()
            if market == 'KOSPI':
                return row['Code'] + '.KS'
            elif market == 'KOSDAQ' or market == 'KOSDAQ GLOBAL':
                return row['Code'] + '.KQ'
            else:
                return row['Code']

        df['symbol'] = df.apply(add_suffix, axis=1)
        df['name'] = df['Name']

        # 원하는 컬럼만 추출
        if limit is not None:
            self.kr_stocks = df[['symbol', 'name']].head(limit).to_dict('records')
        else:
            self.kr_stocks = df[['symbol', 'name']].to_dict('records')

        print(f"한국 주식 {len(self.kr_stocks)}개 로드 완료")
        return self.kr_stocks

    def get_us_stocks(self, csv_path='../data/US_Stock_Master.csv', limit=None):
        print("\n미국 대표 주식 가져오기...")
        # CSV 파일 로드
        df = pd.read_csv(csv_path, dtype={'ACT Symbol': str})

        # 결측값 제거 (심볼이나 이름이 없는 행 제외)
        df = df[['ACT Symbol', 'Company Name']].dropna(subset=['ACT Symbol', 'Company Name'])

        # 컬럼명 통일
        df = df.rename(columns={'ACT Symbol': 'symbol', 'Company Name': 'name'})

        # 딕셔너리 리스트로 변환
        if limit is not None:
            self.us_stocks = df.head(limit).to_dict('records')
        else:
            self.us_stocks = df.to_dict('records')

        print(f"미국 주식 {len(self.us_stocks)}개 로드 완료")
        return self.us_stocks

    def get_beta_from_naver_scraping(self, symbol):
        """네이버 금융 웹 스크래핑으로 베타(Beta) 정보를 가져옵니다"""
        try:
            stock_code = symbol.split('.')[0]
            url = f"https://finance.naver.com/item/main.naver?code={stock_code}"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
            }

            response = requests.get(url, headers=headers, timeout=(5,30))
            if response.status_code != 200:
                return None

            soup = BeautifulSoup(response.text, 'html.parser')

            # 베타값 찾기 시도 1: 테이블에서 베타값 찾기
            beta_element = soup.select_one("table:contains('베타') td.num") or soup.select_one("table:contains('β') td.num")
            if beta_element and beta_element.text.strip():
                beta_text = beta_element.text.strip()
                beta_text = ''.join(c for c in beta_text if c.isdigit() or c == '.' or c == '-')
                if beta_text and beta_text != '-':
                    beta = float(beta_text)
                    if beta > 0:
                        print(f"{symbol}: 네이버 금융에서 베타값 {beta:.4f} 가져옴")
                        return beta

            # 베타값 찾기 시도 2: 다른 방식으로 시도
            # 네이버 금융의 경우 "aws"라는 클래스가 있는 표에 베타값이 포함되어 있을 수 있음
            aws_tables = soup.find_all("table", class_="aws")
            for table in aws_tables:
                rows = table.find_all("tr")
                for row in rows:
                    cols = row.find_all("td")
                    for i, col in enumerate(cols):
                        if '베타' in col.text or 'β' in col.text:
                            if i+1 < len(cols) and cols[i+1].text.strip():
                                beta_text = cols[i+1].text.strip()
                                beta_text = ''.join(c for c in beta_text if c.isdigit() or c == '.' or c == '-')
                                if beta_text and beta_text != '-':
                                    beta = float(beta_text)
                                    if beta > 0:
                                        print(f"{symbol}: 네이버 금융에서 베타값 {beta:.4f} 가져옴")
                                        return beta

            return None
        except Exception as e:
            print(f"{symbol}: 베타값 스크래핑 중 오류 발생 - {e}")
            return None

    def get_pbr_from_naver_scraping(self, symbol):
        """네이버 금융 웹 스크래핑으로 PBR 정보를 가져옵니다"""
        try:
            stock_code = symbol.split('.')[0]
            url = f"https://finance.naver.com/item/main.naver?code={stock_code}"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
            }

            response = requests.get(url, headers=headers, timeout=(5,30))
            if response.status_code != 200:
                return None

            soup = BeautifulSoup(response.text, 'html.parser')
            pbr_element = soup.select_one("table:contains('PBR') td.num")
            if pbr_element and pbr_element.text.strip():
                pbr_text = pbr_element.text.strip()
                pbr_text = ''.join(c for c in pbr_text if c.isdigit() or c == '.' or c == '-')
                if pbr_text and pbr_text != '-':
                    pbr = float(pbr_text)
                    if pbr > 0:
                        print(f"{symbol}: 네이버 금융에서 PBR값 {pbr:.4f} 가져옴")
                        return pbr

            # 다른 방식으로도 시도
            pbr_selector = "#_pbr"
            pbr_element = soup.select_one(pbr_selector)
            if pbr_element and pbr_element.text.strip():
                pbr_text = pbr_element.text.strip()
                pbr_text = ''.join(c for c in pbr_text if c.isdigit() or c == '.' or c == '-')
                if pbr_text and pbr_text != '-':
                    pbr = float(pbr_text)
                    if pbr > 0:
                        print(f"{symbol}: 네이버 금융에서 PBR값 {pbr:.4f} 가져옴")
                        return pbr

            return None
        except Exception:
            return None

    def calculate_indicators_for_korean_stock_pykrx(self, symbol, name, daily_dates):
        """pykrx를 사용하여 한국 종목의 일별 지표를 계산합니다"""
        results = []
        
        try:
            # 종목 코드 추출 (suffix 제거)
            stock_code = symbol.split('.')[0]
            
            # 데이터 기간 설정
            start_date = min(daily_dates) - relativedelta(months=15)
            end_date = max(daily_dates) + relativedelta(days=5)
            
            # pykrx로 가격 데이터 가져오기
            try:
                hist_data = stock.get_market_ohlcv_by_date(
                    start_date.strftime('%Y%m%d'), 
                    end_date.strftime('%Y%m%d'), 
                    stock_code
                )
                
                if hist_data.empty or len(hist_data) < 30:
                    print(f"{symbol}: pykrx 데이터가 충분하지 않습니다 (행 수: {len(hist_data)})")
                    return []
                
                # 컬럼명 변경 (yfinance와 호환)
                hist_data = hist_data.rename(columns={
                    '시가': 'Open',
                    '고가': 'High', 
                    '저가': 'Low',
                    '종가': 'Close',
                    '거래량': 'Volume'
                })
                hist_data['Adj Close'] = hist_data['Close']  # 한국 주식은 수정종가 = 종가
                
                print(f"{symbol}: pykrx로 {len(hist_data)}일치 데이터 가져옴")
                
            except Exception as e:
                print(f"{symbol}: pykrx 데이터 가져오기 실패 - {e}")
                return []
            
            # 재무 정보 가져오기 (pykrx 사용)
            try:
                # 최근 거래일 찾기
                latest_date = None
                for i in range(7):
                    date_str = (datetime.now() - timedelta(days=i)).strftime("%Y%m%d")
                    try:
                        fundamental_data = stock.get_market_fundamental_by_ticker(date_str, market="ALL")
                        if not fundamental_data.empty and stock_code in fundamental_data.index:
                            latest_date = date_str
                            break
                    except:
                        continue
                
                if latest_date:
                    fundamental_data = stock.get_market_fundamental_by_ticker(latest_date, market="ALL")
                    
                    if stock_code in fundamental_data.index:
                        row_data = fundamental_data.loc[stock_code]
                        
                        # PBR 정보
                        pbr = float(row_data.get('PBR', 1.0)) if pd.notna(row_data.get('PBR')) else 1.0
                        
                        # 시가총액 (억원 단위를 원 단위로 변환 후 USD로 변환)
                        market_cap_krw = float(row_data.get('시가총액', 100000)) * 100000000  # 억원 -> 원
                        krw_to_usd = self.get_exchange_rate_krw_to_usd()
                        market_cap = market_cap_krw * krw_to_usd
                        
                        print(f"{symbol}: pykrx에서 PBR={pbr:.2f}, 시가총액={market_cap_krw:,.0f}원 가져옴")
                    else:
                        pbr = 1.0
                        market_cap = 1000000000
                        print(f"{symbol}: pykrx 재무데이터 없음, 기본값 사용")
                else:
                    pbr = 1.0
                    market_cap = 1000000000
                    print(f"{symbol}: pykrx 재무데이터 날짜 없음, 기본값 사용")
                    
            except Exception as e:
                print(f"{symbol}: pykrx 재무정보 가져오기 실패 - {e}")
                pbr = 1.0
                market_cap = 1000000000
            
            # 베타값 (네이버 스크래핑 시도, 실패시 기본값)
            beta_from_naver = self.get_beta_from_naver_scraping(symbol)
            if beta_from_naver is not None:
                beta = min(max(beta_from_naver, -2.0), 4.0)
            else:
                beta = self.default_beta_values.get(symbol, 1.0)
                print(f"{symbol}: 베타값 없음, 기본값 {beta} 사용")
            
            # 섹터/산업 정보 (기본값)
            sector = 'Korean Stock'
            industry = 'Unknown'
            
            # 각 일별 날짜에 대한 지표 계산
            for target_date in daily_dates:
                # 해당일 또는 그 이전 가장 가까운 거래일 찾기
                available_dates = hist_data.index[hist_data.index <= pd.Timestamp(target_date)]
                if len(available_dates) == 0:
                    continue

                closest_date = available_dates.max()
                date_str = closest_date.strftime('%Y-%m-%d')

                # 해당 날짜까지의 데이터 추출
                data_until_date = hist_data.loc[:closest_date]

                # 모멘텀 계산
                current_price = data_until_date['Adj Close'][-1]

                # 1개월 모멘텀
                one_month_ago = closest_date - relativedelta(months=1)
                one_month_prices = data_until_date[data_until_date.index <= one_month_ago]
                momentum_1m = ((current_price / one_month_prices['Adj Close'][-1]) - 1) * 100 if len(one_month_prices) > 0 else 0

                # 3개월 모멘텀
                three_months_ago = closest_date - relativedelta(months=3)
                three_month_prices = data_until_date[data_until_date.index <= three_months_ago]
                momentum_3m = ((current_price / three_month_prices['Adj Close'][-1]) - 1) * 100 if len(three_month_prices) > 0 else 0

                # 6개월 모멘텀
                six_months_ago = closest_date - relativedelta(months=6)
                six_month_prices = data_until_date[data_until_date.index <= six_months_ago]
                momentum_6m = ((current_price / six_month_prices['Adj Close'][-1]) - 1) * 100 if len(six_month_prices) > 0 else 0

                # 12개월 모멘텀
                twelve_months_ago = closest_date - relativedelta(months=12)
                twelve_month_prices = data_until_date[data_until_date.index <= twelve_months_ago]
                momentum_12m = ((current_price / twelve_month_prices['Adj Close'][-1]) - 1) * 100 if len(twelve_month_prices) > 0 else 0

                # 변동성 계산
                returns = data_until_date['Adj Close'].pct_change().dropna()
                volatility = returns.std() * np.sqrt(252) * 100 if len(returns) > 30 else 0

                # RSI 계산
                delta = data_until_date['Adj Close'].diff().dropna()
                up = delta.copy()
                up[up < 0] = 0
                down = -delta.copy()
                down[down < 0] = 0

                avg_gain = up.rolling(window=14).mean()
                avg_loss = down.rolling(window=14).mean()

                rs = avg_gain / avg_loss.replace(0, 0.001)
                rsi = 100 - (100 / (1 + rs))
                rsi_value = rsi.iloc[-1] if len(rsi) > 0 else 50

                # MACD 계산
                exp1 = data_until_date['Adj Close'].ewm(span=12, adjust=False).mean()
                exp2 = data_until_date['Adj Close'].ewm(span=26, adjust=False).mean()
                macd = exp1 - exp2
                signal = macd.ewm(span=9, adjust=False).mean()
                hist = macd - signal

                macd_value = macd.iloc[-1] if len(macd) > 0 else 0
                signal_value = signal.iloc[-1] if len(signal) > 0 else 0
                hist_value = hist.iloc[-1] if len(hist) > 0 else 0

                # 결과 저장
                results.append({
                    'Symbol': symbol,
                    'Name': name,
                    'Date': date_str,
                    'Beta': round(beta, 2),
                    'PBR': round(pbr, 2),
                    'MarketCap': round(market_cap / 1_000_000_000, 2),
                    'Momentum1M': round(momentum_1m, 2),
                    'Momentum3M': round(momentum_3m, 2),
                    'Momentum6M': round(momentum_6m, 2),
                    'Momentum12M': round(momentum_12m, 2),
                    'Volatility': round(volatility, 2),
                    'RSI': round(rsi_value, 2),
                    'MACD': round(macd_value, 2),
                    'Signal': round(signal_value, 2),
                    'MACD_Hist': round(hist_value, 2),
                    'Sector': sector,
                    'Industry': industry,
                    'Beta_Factor': 0,
                    'Value_Factor': 0,
                    'Size_Factor': 0,
                    'Momentum_Factor': 0,
                    'Volatility_Factor': 0,
                    'weighted_score': 0,
                    'factor_percentile': 0,
                    'smart_signal': 'NEUTRAL',
                    'signal_strength': 'MEDIUM',
                    'rebalance_priority': 0,
                    'to_rebalance': 0
                })
                
        except Exception as e:
            print(f"{symbol} pykrx 처리 중 오류 발생: {e}")
            
        return results

    def calculate_indicators_for_stock(self, symbol, name, daily_dates, market_index):
        """특정 종목의 일별 지표를 계산합니다"""
        
        # 한국 주식인 경우 pykrx 사용
        if symbol.endswith('.KS') or symbol.endswith('.KQ'):
            print(f"{symbol}: pykrx 사용하여 처리")
            return self.calculate_indicators_for_korean_stock_pykrx(symbol, name, daily_dates)
        
        # 미국 주식인 경우 기존 yfinance 사용
        results = []

        try:
            # 데이터 다운로드 기간 설정 (충분한 데이터를 위해 여유 있게 설정)
            start_date = min(daily_dates) - relativedelta(months=15)
            end_date = max(daily_dates) + relativedelta(days=5)

            # 히스토리 데이터 다운로드 - auto_adjust=False, multi_level_index=False 설정
            hist_data = yf.download(symbol, start=start_date, end=end_date, progress=False,
                                   auto_adjust=False, multi_level_index=False)

            time.sleep(1)

            if len(hist_data) < 30:
                print(f"{symbol}: 데이터가 충분하지 않습니다 (행 수: {len(hist_data)})")
                return []

            # 재무 정보 가져오기
            ticker_info = yf.Ticker(symbol)
            info = ticker_info.info

            # 섹터, 산업 정보
            sector = info.get('sector', 'Unknown')
            industry = info.get('industry', 'Unknown')

            # 베타값 가져오기
            if 'beta' in info and info['beta'] is not None and not pd.isna(info['beta']):
                beta = float(info['beta'])
                beta = min(max(beta, -2.0), 4.0) # 이상치 방지
            else:
                beta = self.default_beta_values.get(symbol, 1.0)
                print(f"{symbol}: 베타값 없음, 기본값 {beta} 사용")

            # PBR 값 (미국 종목)
            if 'priceToBook' in info and info['priceToBook'] is not None and not pd.isna(info['priceToBook']):
                pbr = float(info['priceToBook'])
                print(f"{symbol}: Yahoo Finance에서 PBR값 {pbr:.4f} 가져옴")
            else:
                pbr = 1.0
                print(f"{symbol}: PBR 정보 없음, 기본값 1.0 사용")

            # 시가총액 처리 (미국 종목)
            if 'marketCap' in info and info['marketCap'] and not pd.isna(info['marketCap']):
                market_cap = info['marketCap']
                print(f"{symbol}: 시가총액 {market_cap:,.0f} USD")
            else:
                market_cap = 1000000000 # 기본값: 10억 USD

            # 각 일별 날짜에 대한 지표 계산
            for target_date in daily_dates:
                # 해당일 또는 그 이전 가장 가까운 거래일 찾기
                available_dates = hist_data.index[hist_data.index <= pd.Timestamp(target_date)]
                if len(available_dates) == 0:
                    print(f"{symbol}: {target_date.strftime('%Y-%m-%d')}에 해당하는 데이터 없음")
                    continue

                closest_date = available_dates.max()
                date_str = closest_date.strftime('%Y-%m-%d')

                # 해당 날짜까지의 데이터 추출
                data_until_date = hist_data.loc[:closest_date]

                # 모멘텀 계산
                current_price = data_until_date['Adj Close'][-1]

                # 1개월 모멘텀
                one_month_ago = closest_date - relativedelta(months=1)
                one_month_prices = data_until_date[data_until_date.index <= one_month_ago]
                momentum_1m = ((current_price / one_month_prices['Adj Close'][-1]) - 1) * 100 if len(one_month_prices) > 0 else 0

                # 3개월 모멘텀
                three_months_ago = closest_date - relativedelta(months=3)
                three_month_prices = data_until_date[data_until_date.index <= three_months_ago]
                momentum_3m = ((current_price / three_month_prices['Adj Close'][-1]) - 1) * 100 if len(three_month_prices) > 0 else 0

                # 6개월 모멘텀
                six_months_ago = closest_date - relativedelta(months=6)
                six_month_prices = data_until_date[data_until_date.index <= six_months_ago]
                momentum_6m = ((current_price / six_month_prices['Adj Close'][-1]) - 1) * 100 if len(six_month_prices) > 0 else 0

                # 12개월 모멘텀
                twelve_months_ago = closest_date - relativedelta(months=12)
                twelve_month_prices = data_until_date[data_until_date.index <= twelve_months_ago]
                momentum_12m = ((current_price / twelve_month_prices['Adj Close'][-1]) - 1) * 100 if len(twelve_month_prices) > 0 else 0

                # 변동성 계산
                returns = data_until_date['Adj Close'].pct_change().dropna()
                volatility = returns.std() * np.sqrt(252) * 100 if len(returns) > 30 else 0 # 연간화, 퍼센트 변환

                # RSI 계산
                delta = data_until_date['Adj Close'].diff().dropna()
                up = delta.copy()
                up[up < 0] = 0
                down = -delta.copy()
                down[down < 0] = 0

                avg_gain = up.rolling(window=14).mean()
                avg_loss = down.rolling(window=14).mean()

                rs = avg_gain / avg_loss.replace(0, 0.001) # 0으로 나누기 방지
                rsi = 100 - (100 / (1 + rs))
                rsi_value = rsi.iloc[-1]

                # MACD 계산
                exp1 = data_until_date['Adj Close'].ewm(span=12, adjust=False).mean()
                exp2 = data_until_date['Adj Close'].ewm(span=26, adjust=False).mean()
                macd = exp1 - exp2
                signal = macd.ewm(span=9, adjust=False).mean()
                hist = macd - signal

                macd_value = macd.iloc[-1]
                signal_value = signal.iloc[-1]
                hist_value = hist.iloc[-1]

                # 결과 저장
                results.append({
                    'Symbol': symbol,
                    'Name': name,
                    'Date': date_str,
                    'Beta': round(beta, 2),
                    'PBR': round(pbr, 2),
                    'MarketCap': round(market_cap / 1_000_000_000, 2), # 10억 단위로 변환
                    'Momentum1M': round(momentum_1m, 2),
                    'Momentum3M': round(momentum_3m, 2),
                    'Momentum6M': round(momentum_6m, 2),
                    'Momentum12M': round(momentum_12m, 2),
                    'Volatility': round(volatility, 2),
                    'RSI': round(rsi_value, 2),
                    'MACD': round(macd_value, 2),
                    'Signal': round(signal_value, 2),
                    'MACD_Hist': round(hist_value, 2),
                    'Sector': sector,
                    'Industry': industry,
                    'Beta_Factor': 0,
                    'Value_Factor': 0,
                    'Size_Factor': 0,
                    'Momentum_Factor': 0,
                    'Volatility_Factor': 0,
                    'weighted_score': 0,
                    'factor_percentile': 0,
                    'smart_signal': 'NEUTRAL',
                    'signal_strength': 'MEDIUM',
                    'rebalance_priority': 0,
                    'to_rebalance': 0
                })

        except Exception as e:
            print(f"{symbol} 처리 중 오류 발생: {e}")

        return results

    def calculate_all_indicators(self, batch_size=None, use_all_stocks=True):
        """모든 종목에 대한 일별 지표를 계산합니다"""
        all_results = []

        # 한국 주식 시장 일별 날짜 생성
        kr_dates = self.generate_daily_dates('KRX')

        # 미국 주식 시장 일별 날짜 생성
        us_dates = self.generate_daily_dates('NYSE')

        # 종목 목록 가져오기
        if not self.kr_stocks:
            if use_all_stocks:
                self.get_korean_stocks(limit=None)  # 모든 한국 주식
            else:
                self.get_korean_stocks(limit=20)    # 테스트용 20개만

        if not self.us_stocks:
            if use_all_stocks:
                self.get_us_stocks(limit=None)      # 모든 미국 주식
            else:
                self.get_us_stocks(limit=20)       # 테스트용 20개만

        # 한국 주식 처리
        print(f"\n한국 주식 데이터 처리 중... (총 {len(self.kr_stocks)}개)")
        failed_kr_stocks = []
        
        for idx, stock in enumerate(self.kr_stocks, 1):
            symbol = stock['symbol']
            name = stock['name']

            print(f"[{idx}/{len(self.kr_stocks)}] {name} ({symbol}) 처리 중...")
            
            try:
                results = self.calculate_indicators_for_stock(symbol, name, kr_dates, '^KS11')
                all_results.extend(results)
                
                # 진행률 표시 (10% 단위)
                if idx % max(1, len(self.kr_stocks) // 10) == 0:
                    progress = (idx / len(self.kr_stocks)) * 100
                    print(f"  📊 한국 주식 진행률: {progress:.1f}% ({idx}/{len(self.kr_stocks)})")
                    
            except Exception as e:
                print(f"  ❌ {symbol} 처리 실패: {e}")
                failed_kr_stocks.append(f"{symbol} - {name}")
                continue

            # 배치 처리: API 호출 제한을 위한 대기
            if batch_size and idx % batch_size == 0:
                print(f"  ⏳ 배치 처리 대기 중... ({idx}/{len(self.kr_stocks)})")
                time.sleep(2)  # 2초 대기

        # 미국 주식 처리
        print(f"\n미국 주식 데이터 처리 중... (총 {len(self.us_stocks)}개)")
        failed_us_stocks = []
        
        for idx, stock in enumerate(self.us_stocks, 1):
            symbol = stock['symbol']
            name = stock['name']

            print(f"[{idx}/{len(self.us_stocks)}] {name} ({symbol}) 처리 중...")
            
            try:
                results = self.calculate_indicators_for_stock(symbol, name, us_dates, '^GSPC')
                all_results.extend(results)
                
                # 진행률 표시 (10% 단위)
                if idx % max(1, len(self.us_stocks) // 10) == 0:
                    progress = (idx / len(self.us_stocks)) * 100
                    print(f"  📊 미국 주식 진행률: {progress:.1f}% ({idx}/{len(self.us_stocks)})")
                    
            except Exception as e:
                print(f"  ❌ {symbol} 처리 실패: {e}")
                failed_us_stocks.append(f"{symbol} - {name}")
                continue

            # 배치 처리: API 호출 제한을 위한 대기
            if batch_size and idx % batch_size == 0:
                print(f"  ⏳ 배치 처리 대기 중... ({idx}/{len(self.us_stocks)})")
                time.sleep(2)  # 2초 대기

        # 실패한 종목 요약
        if failed_kr_stocks or failed_us_stocks:
            print(f"\n⚠️  처리 실패한 종목들:")
            if failed_kr_stocks:
                print(f"  한국 주식 ({len(failed_kr_stocks)}개): {', '.join(failed_kr_stocks[:5])}")
                if len(failed_kr_stocks) > 5:
                    print(f"    ... 및 {len(failed_kr_stocks) - 5}개 더")
            if failed_us_stocks:
                print(f"  미국 주식 ({len(failed_us_stocks)}개): {', '.join(failed_us_stocks[:5])}")
                if len(failed_us_stocks) > 5:
                    print(f"    ... 및 {len(failed_us_stocks) - 5}개 더")

        # 데이터프레임으로 변환
        self.factor_model_data = pd.DataFrame(all_results)
        
        # 처리 결과 요약
        total_processed = len(self.kr_stocks) + len(self.us_stocks)
        total_failed = len(failed_kr_stocks) + len(failed_us_stocks)
        success_rate = ((total_processed - total_failed) / total_processed * 100) if total_processed > 0 else 0
        
        print(f"\n✅ 처리 완료!")
        print(f"  📈 총 종목: {total_processed}개")
        print(f"  ✅ 성공: {total_processed - total_failed}개")
        print(f"  ❌ 실패: {total_failed}개")
        print(f"  📊 성공률: {success_rate:.1f}%")
        print(f"  📋 데이터 포인트: {len(all_results):,}개")

        return self.factor_model_data

    def calculate_factor_scores(self):
        """각 일별 날짜에 대한 팩터 점수를 계산합니다"""
        if len(self.factor_model_data) == 0:
            print("계산할 데이터가 없습니다")
            return

        print("\n팩터 점수 계산 중...")

        for date in self.factor_model_data['Date'].unique():
            date_df = self.factor_model_data[self.factor_model_data['Date'] == date].copy()

            if len(date_df) < 5: # 충분한 종목이 없으면 건너뜀
                print(f"{date} 날짜에 충분한 종목 데이터가 없어 팩터 점수 계산을 건너뜁니다")
                continue

            # 팩터 순위 계산 (퍼센타일로)
            date_df['Beta_Factor'] = -date_df['Beta'].rank(pct=True) # 베타가 낮을수록 좋음
            date_df['Value_Factor'] = -date_df['PBR'].rank(pct=True) # PBR이 낮을수록 좋음
            date_df['Size_Factor'] = -date_df['MarketCap'].rank(pct=True) # 소형주가 선호됨
            date_df['Momentum_Factor'] = date_df['Momentum12M'].rank(pct=True) # 모멘텀이 높을수록 좋음
            date_df['Volatility_Factor'] = -date_df['Volatility'].rank(pct=True) # 변동성이 낮을수록 좋음

            # 가중 점수 계산
            date_df['weighted_score'] = (
                date_df['Beta_Factor'] * self.factor_weights['Beta_Factor'] +
                date_df['Value_Factor'] * self.factor_weights['Value_Factor'] +
                date_df['Size_Factor'] * self.factor_weights['Size_Factor'] +
                date_df['Momentum_Factor'] * self.factor_weights['Momentum_Factor'] +
                date_df['Volatility_Factor'] * self.factor_weights['Volatility_Factor']
            )

            # 가중 점수의 퍼센타일 계산
            date_df['factor_percentile'] = date_df['weighted_score'].rank(pct=True)

            # 신호 생성
            date_df['smart_signal'] = 'NEUTRAL'
            date_df.loc[date_df['factor_percentile'] > 0.7, 'smart_signal'] = 'BUY'
            date_df.loc[date_df['factor_percentile'] < 0.3, 'smart_signal'] = 'SELL'

            # 신호 강도
            date_df['signal_strength'] = 'MEDIUM'
            date_df.loc[date_df['factor_percentile'] > 0.9, 'signal_strength'] = 'STRONG'
            date_df.loc[date_df['factor_percentile'] < 0.1, 'signal_strength'] = 'STRONG'

            # 리밸런싱 우선순위
            date_df['rebalance_priority'] = date_df['factor_percentile'].rank(ascending=False)

            # 리밸런싱 플래그
            date_df['to_rebalance'] = 0
            date_df.loc[date_df['smart_signal'] != 'NEUTRAL', 'to_rebalance'] = 1

            # 메인 데이터프레임 업데이트
            for index, row in date_df.iterrows():
                mask = (self.factor_model_data['Symbol'] == row['Symbol']) & (self.factor_model_data['Date'] == date)
                for col in ['Beta_Factor', 'Value_Factor', 'Size_Factor', 'Momentum_Factor',
                           'Volatility_Factor', 'weighted_score', 'factor_percentile',
                           'smart_signal', 'signal_strength', 'rebalance_priority', 'to_rebalance']:
                    self.factor_model_data.loc[mask, col] = row[col]

        print("팩터 점수 계산 완료")
        return self.factor_model_data

    def save_data(self):
        """계산된 데이터를 저장합니다"""
        if len(self.factor_model_data) == 0:
            print("저장할 데이터가 없습니다")
            return None

        # 날짜와 티커로 정렬
        self.factor_model_data = self.factor_model_data.sort_values(['Date', 'Symbol'])

        # 컬럼 순서 재정렬
        cols = ['Symbol', 'Name', 'Date', 'Beta', 'PBR', 'MarketCap',
               'Momentum1M', 'Momentum3M', 'Momentum6M', 'Momentum12M',
               'Volatility', 'RSI', 'MACD', 'Signal', 'MACD_Hist',
               'Sector', 'Industry', 'Beta_Factor', 'Value_Factor',
               'Size_Factor', 'Momentum_Factor', 'Volatility_Factor',
               'weighted_score', 'factor_percentile', 'smart_signal',
               'signal_strength', 'rebalance_priority', 'to_rebalance']

        self.factor_model_data = self.factor_model_data[cols]

        # CSV 저장
        date_str = self.current_date.strftime('%Y%m%d')
        output_file = f"processed_daily_5factor_model_{date_str}.csv"
        self.factor_model_data.to_csv(output_file, index=False)
        print(f"\n데이터가 {output_file}에 저장되었습니다")

        # 요약 정보 출력
        print(f"\n데이터 요약:")
        print(f"- 처리된 종목 수: {self.factor_model_data['Symbol'].nunique()}")
        print(f"- 처리된 일 수: {self.factor_model_data['Date'].nunique()}")
        print(f"- 총 행 수: {len(self.factor_model_data)}")

        # 매수/매도 신호 개수
        buy_count = len(self.factor_model_data[self.factor_model_data['smart_signal'] == 'BUY'])
        sell_count = len(self.factor_model_data[self.factor_model_data['smart_signal'] == 'SELL'])
        print(f"- 매수 신호 수: {buy_count}")
        print(f"- 매도 신호 수: {sell_count}")

        return output_file

    def run_pipeline(self):
        """전체 데이터 파이프라인을 실행합니다"""
        print(f"시작 시간: {self.current_date.strftime('%Y-%m-%d %H:%M:%S')}")

        # 주식 목록 가져오기
        if self.use_all_stocks:
            print("📊 전체 주식 처리 모드")
            self.get_korean_stocks(limit=None)
            self.get_us_stocks(limit=None)
        else:
            print("🧪 테스트 모드 (각 20개씩)")
            self.get_korean_stocks(limit=20)
            self.get_us_stocks(limit=20)

        total_stocks = len(self.kr_stocks) + len(self.us_stocks)
        print(f"총 처리 예정 종목: {total_stocks:,}개 (한국: {len(self.kr_stocks)}, 미국: {len(self.us_stocks)})")
        
        # 예상 소요 시간 계산 (종목당 평균 2초 가정)
        estimated_time = total_stocks * 2 / 60  # 분 단위
        print(f"예상 소요 시간: 약 {estimated_time:.1f}분")

        # 일별 지표 계산
        self.calculate_all_indicators(
            batch_size=self.batch_size, 
            use_all_stocks=self.use_all_stocks
        )

        # 팩터 점수 계산
        self.calculate_factor_scores()

        # 데이터 저장
        self.save_data()

        # 총 실행 시간 출력
        elapsed_time = time.time() - self.start_time
        elapsed_minutes = elapsed_time / 60
        print(f"\n🎉 전체 처리 완료!")
        print(f"   총 실행 시간: {elapsed_time:.2f}초 ({elapsed_minutes:.1f}분)")
        print(f"   평균 종목당 시간: {elapsed_time/total_stocks:.2f}초" if total_stocks > 0 else "")

        return self.factor_model_data

# 실행 코드
if __name__ == "__main__":
    print("=== Daily 5-Factor Stock Model ===")
    print("실제 주식 데이터를 사용한 5팩터 분석 모델")
    print("=" * 50)
    
    # 전체 주식 처리 모드로 자동 설정
    print("\n📊 CSV 파일의 모든 종목을 처리합니다...")
    print("⚠️  전체 주식 처리는 매우 오래 걸릴 수 있습니다 (1-3시간)")
    
    # 전체 주식 처리 모델 생성
    model = DailyStockFactorModel(use_all_stocks=True, batch_size=50)
    
    print("\n🚀 모델 실행 시작...")
    result = model.run_pipeline()
    
    print(f"\n📁 결과 파일이 생성되었습니다.")
    print(f"데이터 포인트: {len(result):,}개")
    print("처리 완료!") 