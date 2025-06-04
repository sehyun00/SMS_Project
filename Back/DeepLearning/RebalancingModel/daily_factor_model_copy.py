"""
Daily 5-Factor Stock Model
일별 5팩터 주식 모델 - 한국/미국 주식 분석 및 리밸런싱 신호 생성
Yahoo Finance 웹 스크래핑 전용 고속 모드
"""

import pandas as pd
import numpy as np
import pandas_market_calendars as mcal
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import warnings
import time
import os
from bs4 import BeautifulSoup
import requests
from sklearn.preprocessing import RobustScaler

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
    def __init__(self, batch_size=50):
        print("일별 5팩터 모델 데이터 처리 시작 - Yahoo Finance 웹 스크래핑 고속모드")
        self.start_time = time.time()

        # 설정
        self.batch_size = batch_size         # 배치 처리 크기 (웹 스크래핑 제한 대응)

        # 현재 날짜 설정
        self.current_date = datetime.now()
        # 1년 전 날짜 계산
        self.one_year_ago = self.current_date - relativedelta(years=1)

        # 한국/미국 대표 주식 리스트
        self.kr_stocks = []
        self.us_stocks = []

        # 데이터 저장용 변수
        self.stock_data = {}
        self.daily_dates = []
        self.factor_model_data = pd.DataFrame()

        # 기본 베타값 딕셔너리 (스크래핑에서 가져오지 못할 경우 사용)
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
            '000020.KS': 0.83,
            # 미국 주식 기본값
            'AAPL': 1.2, 'MSFT': 0.9, 'GOOGL': 1.1, 'AMZN': 1.3, 'TSLA': 1.8,
            'META': 1.4, 'NVDA': 1.6, 'BRK-B': 0.8, 'UNH': 0.7, 'JNJ': 0.6
        }

        # 팩터 가중치 설정
        self.factor_weights = {
            'Beta_Factor': 0.20,
            'Value_Factor': 0.20,
            'Size_Factor': 0.20,
            'Momentum_Factor': 0.20,
            'Volatility_Factor': 0.20
        }

        print(f"설정: 모든 주식 처리 (Yahoo Finance 웹 스크래핑 고속모드)")
        print(f"배치 크기: {self.batch_size}")

    def get_exchange_rate_krw_to_usd(self):
        """KRW to USD 환율을 가져옵니다"""
        try:
            url = "https://api.exchangerate-api.com/v4/latest/USD"
            response = requests.get(url, timeout=10)
            data = response.json()

            usd_to_krw = data['rates']['KRW']
            krw_to_usd = 1 / usd_to_krw

            print(f"현재 환율: 1 USD = {usd_to_krw:.2f} KRW, 1 KRW = {krw_to_usd:.8f} USD")
            return krw_to_usd
        except Exception as e:
            print(f"환율 정보 가져오기 실패: {e}, 기본 환율 사용")
            return 0.00072

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

    def get_korean_stocks(self, csv_path='../data/KR_Stock_Master.csv'):
        print("\n한국 주식 전체 가져오기...")
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

        # 모든 종목 가져오기
        self.kr_stocks = df[['symbol', 'name']].to_dict('records')

        print(f"한국 주식 {len(self.kr_stocks)}개 로드 완료")
        return self.kr_stocks

    def get_us_stocks(self, csv_path='../data/US_Stock_Master.csv'):
        print("\n미국 주식 전체 가져오기...")
        # CSV 파일 로드
        df = pd.read_csv(csv_path, dtype={'ACT Symbol': str})

        # 결측값 제거 (심볼이나 이름이 없는 행 제외)
        df = df[['ACT Symbol', 'Company Name']].dropna(subset=['ACT Symbol', 'Company Name'])

        # 컬럼명 통일
        df = df.rename(columns={'ACT Symbol': 'symbol', 'Company Name': 'name'})

        # 모든 종목 가져오기
        self.us_stocks = df.to_dict('records')

        print(f"미국 주식 {len(self.us_stocks)}개 로드 완료")
        return self.us_stocks

    def get_yahoo_finance_data_by_scraping(self, symbol, start_date, end_date):
        """Yahoo Finance 웹 스크래핑으로 가격 데이터를 가져옵니다 - 개선된 버전"""
        try:
            # datetime.date 객체를 datetime.datetime 객체로 변환
            if hasattr(start_date, 'date'):
                start_dt = start_date
            else:
                start_dt = datetime.combine(start_date, datetime.min.time())
                
            if hasattr(end_date, 'date'):
                end_dt = end_date
            else:
                end_dt = datetime.combine(end_date, datetime.min.time())
            
            # Unix 타임스탬프로 변환
            start_timestamp = int(start_dt.timestamp())
            end_timestamp = int(end_dt.timestamp())
            
            # Yahoo Finance 히스토리 URL
            url = f"https://finance.yahoo.com/quote/{symbol}/history?period1={start_timestamp}&period2={end_timestamp}&interval=1d&filter=history&frequency=1d"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-User': '?1',
                'Sec-Fetch-Dest': 'document',
            }
            
            response = requests.get(url, headers=headers, timeout=30)
            if response.status_code != 200:
                print(f"{symbol}: Yahoo Finance 웹페이지 접근 실패 (상태코드: {response.status_code})")
                return None
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 여러 방법으로 테이블 찾기 시도
            table = None
            
            # 방법 1: data-test 속성으로 찾기
            table = soup.find('table', {'data-test': 'historical-prices'})
            
            if not table:
                # 방법 2: table 태그 직접 찾기 (가장 일반적인 테이블)
                tables = soup.find_all('table')
                for t in tables:
                    # 테이블 헤더에 Date, Open, High, Low, Close가 있는지 확인
                    headers = t.find_all('th')
                    if len(headers) >= 6:
                        header_text = ' '.join([th.text.strip().lower() for th in headers])
                        if 'date' in header_text and 'open' in header_text and 'close' in header_text:
                            table = t
                            print(f"{symbol}: 일반 테이블에서 히스토리 데이터 찾음")
                            break
            
            if not table:
                # 방법 3: tbody가 있는 모든 테이블 확인
                tables = soup.find_all('table')
                for t in tables:
                    tbody = t.find('tbody')
                    if tbody:
                        rows = tbody.find_all('tr')
                        if len(rows) > 5:  # 최소 5개 이상의 데이터 행이 있는 테이블
                            # 첫 번째 행을 확인해서 날짜 형식인지 체크
                            first_row = rows[0]
                            cols = first_row.find_all('td')
                            if len(cols) >= 6:
                                first_col = cols[0].text.strip()
                                # 날짜 형식인지 확인 (MMM DD, YYYY 또는 YYYY-MM-DD 형식)
                                if (',' in first_col and len(first_col.split()) >= 3) or '-' in first_col:
                                    table = t
                                    print(f"{symbol}: tbody 분석으로 히스토리 데이터 찾음")
                                    break
            
            if not table:
                print(f"{symbol}: 모든 방법으로 가격 데이터 테이블을 찾을 수 없음")
                # 디버깅: 페이지에 있는 모든 테이블 수 출력
                all_tables = soup.find_all('table')
                print(f"  페이지에서 발견된 총 테이블 수: {len(all_tables)}")
                if len(all_tables) > 0:
                    print(f"  첫 번째 테이블 내용 미리보기: {all_tables[0].text[:200]}")
                return None
            
            # 테이블 행 파싱
            tbody = table.find('tbody')
            if not tbody:
                # tbody가 없는 경우 table에서 직접 tr 찾기
                rows = table.find_all('tr')[1:]  # 헤더 제외
            else:
                rows = tbody.find_all('tr')
            
            data = []
            
            for row in rows:
                cols = row.find_all('td')
                if len(cols) >= 6:  # 최소 6개 컬럼 (Date, Open, High, Low, Close, Volume)
                    try:
                        date_str = cols[0].text.strip()
                        
                        # 6개 컬럼인 경우 (Adj Close 없음)
                        if len(cols) == 6:
                            open_price = self.parse_price(cols[1].text.strip())
                            high_price = self.parse_price(cols[2].text.strip())
                            low_price = self.parse_price(cols[3].text.strip())
                            close_price = self.parse_price(cols[4].text.strip())
                            adj_close = close_price  # Adj Close = Close로 설정
                            volume = self.parse_volume(cols[5].text.strip())
                        # 7개 컬럼인 경우 (Adj Close 있음)
                        else:
                            open_price = self.parse_price(cols[1].text.strip())
                            high_price = self.parse_price(cols[2].text.strip())
                            low_price = self.parse_price(cols[3].text.strip())
                            close_price = self.parse_price(cols[4].text.strip())
                            adj_close = self.parse_price(cols[5].text.strip())
                            volume = self.parse_volume(cols[6].text.strip())
                        
                        if all(v is not None for v in [open_price, high_price, low_price, close_price]):
                            try:
                                parsed_date = pd.to_datetime(date_str)
                                data.append({
                                    'Date': parsed_date,
                                    'Open': open_price,
                                    'High': high_price,
                                    'Low': low_price,
                                    'Close': close_price,
                                    'Adj Close': adj_close or close_price,
                                    'Volume': volume or 0
                                })
                            except:
                                continue
                    except Exception as e:
                        continue
            
            if not data:
                print(f"{symbol}: 파싱된 데이터가 없음")
                return None
            
            # DataFrame 생성
            df = pd.DataFrame(data)
            df.set_index('Date', inplace=True)
            df.sort_index(inplace=True)
            
            print(f"{symbol}: Yahoo Finance 스크래핑으로 {len(df)}일치 데이터 가져옴")
            return df
            
        except Exception as e:
            print(f"{symbol}: Yahoo Finance 스크래핑 실패 - {e}")
            return None

    def parse_price(self, price_str):
        """가격 문자열을 float로 변환"""
        try:
            if price_str == '-' or not price_str:
                return None
            # 쉼표 제거하고 숫자만 추출
            cleaned = ''.join(c for c in price_str if c.isdigit() or c == '.')
            return float(cleaned) if cleaned else None
        except:
            return None
    
    def parse_volume(self, volume_str):
        """거래량 문자열을 정수로 변환"""
        try:
            if volume_str == '-' or not volume_str:
                return 0
            # K, M, B 단위 처리
            volume_str = volume_str.replace(',', '')
            if 'K' in volume_str:
                return int(float(volume_str.replace('K', '')) * 1000)
            elif 'M' in volume_str:
                return int(float(volume_str.replace('M', '')) * 1000000)
            elif 'B' in volume_str:
                return int(float(volume_str.replace('B', '')) * 1000000000)
            else:
                return int(float(volume_str)) if volume_str.isdigit() else 0
        except:
            return 0

    def get_yahoo_finance_info_by_scraping(self, symbol):
        """Yahoo Finance 웹 스크래핑으로 종목 정보를 가져옵니다 - 개선된 버전"""
        try:
            url = f"https://finance.yahoo.com/quote/{symbol}"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-User': '?1',
                'Sec-Fetch-Dest': 'document',
            }
            
            response = requests.get(url, headers=headers, timeout=30)
            if response.status_code != 200:
                print(f"{symbol}: Yahoo Finance 정보 페이지 접근 실패")
                return {}
            
            soup = BeautifulSoup(response.text, 'html.parser')
            info = {}
            
            # 방법 1: Statistics 테이블에서 찾기
            try:
                stats_table = soup.find('table', {'data-test': 'quote-statistics'})
                if stats_table:
                    rows = stats_table.find_all('tr')
                    for row in rows:
                        cells = row.find_all('td')
                        if len(cells) >= 2:
                            label = cells[0].text.strip()
                            value = cells[1].text.strip()
                            
                            if 'Beta' in label:
                                try:
                                    info['beta'] = float(value)
                                    print(f"{symbol}: Statistics 테이블에서 베타값 {info['beta']:.4f} 가져옴")
                                except:
                                    pass
                            elif 'Price/Book' in label or 'P/B' in label:
                                try:
                                    info['priceToBook'] = float(value)
                                    print(f"{symbol}: Statistics 테이블에서 PBR값 {info['priceToBook']:.4f} 가져옴")
                                except:
                                    pass
                            elif 'Market Cap' in label:
                                try:
                                    market_cap_str = value.replace(',', '')
                                    if 'T' in market_cap_str:
                                        info['marketCap'] = int(float(market_cap_str.replace('T', '')) * 1_000_000_000_000)
                                    elif 'B' in market_cap_str:
                                        info['marketCap'] = int(float(market_cap_str.replace('B', '')) * 1_000_000_000)
                                    elif 'M' in market_cap_str:
                                        info['marketCap'] = int(float(market_cap_str.replace('M', '')) * 1_000_000)
                                    else:
                                        info['marketCap'] = int(float(market_cap_str))
                                    print(f"{symbol}: Statistics 테이블에서 시가총액 {info['marketCap']:,.0f} USD 가져옴")
                                except:
                                    pass
            except Exception as e:
                pass
            
            # 방법 2: 메인 요약 정보에서 찾기 (더 일반적)
            try:
                # 베타값 찾기 - 다양한 방법 시도
                if 'beta' not in info:
                    # span 태그에서 베타값 찾기
                    beta_spans = soup.find_all('span', string=lambda text: text and 'Beta' in text)
                    for span in beta_spans:
                        parent = span.parent
                        if parent:
                            next_elem = parent.find_next('span')
                            if next_elem and next_elem.text.strip():
                                try:
                                    beta_value = float(next_elem.text.strip())
                                    info['beta'] = beta_value
                                    print(f"{symbol}: span 태그에서 베타값 {info['beta']:.4f} 가져옴")
                                    break
                                except:
                                    continue
                
                # 시가총액 찾기 - 다양한 방법 시도
                if 'marketCap' not in info:
                    # "Market Cap" 텍스트가 포함된 요소 찾기
                    market_cap_elements = soup.find_all(string=lambda text: text and 'Market Cap' in text)
                    for elem in market_cap_elements:
                        parent = elem.parent if hasattr(elem, 'parent') else elem
                        if parent:
                            # 형제나 다음 요소에서 값 찾기
                            next_sibling = parent.find_next_sibling()
                            if next_sibling and next_sibling.text.strip():
                                try:
                                    market_cap_text = next_sibling.text.strip()
                                    market_cap_str = market_cap_text.replace(',', '')
                                    if 'T' in market_cap_str:
                                        info['marketCap'] = int(float(market_cap_str.replace('T', '')) * 1_000_000_000_000)
                                    elif 'B' in market_cap_str:
                                        info['marketCap'] = int(float(market_cap_str.replace('B', '')) * 1_000_000_000)
                                    elif 'M' in market_cap_str:
                                        info['marketCap'] = int(float(market_cap_str.replace('M', '')) * 1_000_000)
                                    else:
                                        # 숫자만 있는 경우
                                        clean_number = ''.join(c for c in market_cap_str if c.isdigit() or c == '.')
                                        if clean_number:
                                            info['marketCap'] = int(float(clean_number))
                                    print(f"{symbol}: Market Cap 요소에서 시가총액 {info['marketCap']:,.0f} USD 가져옴")
                                    break
                                except:
                                    continue
                
                # PBR 찾기
                if 'priceToBook' not in info:
                    pbr_elements = soup.find_all(string=lambda text: text and ('P/B' in text or 'Price/Book' in text))
                    for elem in pbr_elements:
                        parent = elem.parent if hasattr(elem, 'parent') else elem
                        if parent:
                            next_sibling = parent.find_next_sibling()
                            if next_sibling and next_sibling.text.strip():
                                try:
                                    pbr_value = float(next_sibling.text.strip())
                                    info['priceToBook'] = pbr_value
                                    print(f"{symbol}: PBR 요소에서 PBR값 {info['priceToBook']:.4f} 가져옴")
                                    break
                                except:
                                    continue
                                    
            except Exception as e:
                pass
            
            # 방법 3: 정규식으로 텍스트에서 직접 추출
            try:
                import re
                page_text = soup.get_text()
                
                # 베타값 정규식 추출
                if 'beta' not in info:
                    beta_pattern = r'Beta.*?(\d+\.\d+)'
                    beta_match = re.search(beta_pattern, page_text, re.IGNORECASE)
                    if beta_match:
                        try:
                            info['beta'] = float(beta_match.group(1))
                            print(f"{symbol}: 정규식으로 베타값 {info['beta']:.4f} 가져옴")
                        except:
                            pass
                
                # 시가총액 정규식 추출
                if 'marketCap' not in info:
                    market_cap_pattern = r'Market Cap.*?(\d+\.?\d*[TMB]?)'
                    market_cap_match = re.search(market_cap_pattern, page_text, re.IGNORECASE)
                    if market_cap_match:
                        try:
                            market_cap_str = market_cap_match.group(1)
                            if 'T' in market_cap_str:
                                info['marketCap'] = int(float(market_cap_str.replace('T', '')) * 1_000_000_000_000)
                            elif 'B' in market_cap_str:
                                info['marketCap'] = int(float(market_cap_str.replace('B', '')) * 1_000_000_000)
                            elif 'M' in market_cap_str:
                                info['marketCap'] = int(float(market_cap_str.replace('M', '')) * 1_000_000)
                            else:
                                info['marketCap'] = int(float(market_cap_str))
                            print(f"{symbol}: 정규식으로 시가총액 {info['marketCap']:,.0f} USD 가져옴")
                        except:
                            pass
                            
            except Exception as e:
                pass
            
            # 섹터/산업 정보 찾기
            try:
                profile_section = soup.find('section', {'data-test': 'qsp-profile'})
                if profile_section:
                    spans = profile_section.find_all('span')
                    for i, span in enumerate(spans):
                        text = span.text.strip()
                        if 'Sector' in text and i + 1 < len(spans):
                            info['sector'] = spans[i + 1].text.strip()
                        elif 'Industry' in text and i + 1 < len(spans):
                            info['industry'] = spans[i + 1].text.strip()
            except Exception as e:
                pass
            
            return info
            
        except Exception as e:
            print(f"{symbol}: Yahoo Finance 정보 스크래핑 실패 - {e}")
            return {}

    def calculate_indicators_for_stock(self, symbol, name, daily_dates, market_index):
        """특정 종목의 일별 지표를 계산합니다 - Yahoo Finance 전용 (고속 모드)"""
        results = []

        try:
            # 데이터 다운로드 기간 설정 (충분한 데이터를 위해 여유 있게 설정)
            start_date = min(daily_dates) - relativedelta(months=15)
            end_date = max(daily_dates) + relativedelta(days=5)

            # Yahoo Finance 웹 스크래핑으로 히스토리 데이터 가져오기 (네이버 백업 제거)
            hist_data = self.get_yahoo_finance_data_by_scraping(symbol, start_date, end_date)
            
            if hist_data is None or len(hist_data) < 30:
                print(f"{symbol}: Yahoo Finance에서 데이터 수집 실패 (행 수: {len(hist_data) if hist_data is not None else 0})")
                return []

            # Yahoo Finance 웹 스크래핑으로 재무 정보 가져오기
            ticker_info = self.get_yahoo_finance_info_by_scraping(symbol)

            # 섹터, 산업 정보
            sector = ticker_info.get('sector', 'Korean Stock' if symbol.endswith('.KS') or symbol.endswith('.KQ') else 'Unknown')
            industry = ticker_info.get('industry', 'Unknown')

            # 베타값 가져오기 - Yahoo Finance만 사용
            if 'beta' in ticker_info and ticker_info['beta'] is not None:
                beta = float(ticker_info['beta'])
                beta = min(max(beta, -2.0), 4.0) # 이상치 방지
                print(f"{symbol}: Yahoo에서 베타값 {beta:.4f} 가져옴")
            else:
                beta = self.default_beta_values.get(symbol, 1.0)
                print(f"{symbol}: 베타값 없음, 기본값 {beta} 사용")

            # PBR 값 - Yahoo Finance만 사용
            if 'priceToBook' in ticker_info and ticker_info['priceToBook'] is not None:
                pbr = float(ticker_info['priceToBook'])
                print(f"{symbol}: Yahoo에서 PBR값 {pbr:.4f} 가져옴")
            else:
                pbr = 1.0
                print(f"{symbol}: PBR 정보 없음, 기본값 1.0 사용")

            # 시가총액 처리
            if 'marketCap' in ticker_info and ticker_info['marketCap']:
                market_cap = ticker_info['marketCap']
                if symbol.endswith('.KS') or symbol.endswith('.KQ'): # 한국 종목의 경우 KRW를 USD로 변환
                    krw_to_usd = self.get_exchange_rate_krw_to_usd()
                    market_cap = market_cap * krw_to_usd
                    print(f"{symbol}: 시가총액 {ticker_info['marketCap']:,.0f} KRW → {market_cap:,.0f} USD로 변환")
                else:
                    print(f"{symbol}: 시가총액 {market_cap:,.0f} USD")
            else:
                market_cap = 1000000000 # 기본값: 10억 USD
                print(f"{symbol}: 시가총액 정보 없음, 기본값 사용")

            # 웹 스크래핑 제한을 위한 대기 (최소화)
            # time.sleep(0.1)

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
            print(f"{symbol} Yahoo Finance 처리 중 오류 발생: {e}")

        return results

    def calculate_all_indicators(self, batch_size=None):
        """모든 종목에 대한 일별 지표를 계산합니다 - Yahoo Finance 웹 스크래핑 고속 모드"""
        all_results = []

        # 한국 주식 시장 일별 날짜 생성
        kr_dates = self.generate_daily_dates('KRX')

        # 미국 주식 시장 일별 날짜 생성
        us_dates = self.generate_daily_dates('NYSE')

        # 종목 목록 가져오기 (모든 종목)
        if not self.kr_stocks:
            self.get_korean_stocks()  # 모든 한국 주식

        if not self.us_stocks:
            self.get_us_stocks()      # 모든 미국 주식

        # 한국 주식 처리
        print(f"\n🇰🇷 한국 주식 Yahoo Finance 웹 스크래핑 처리 중... (총 {len(self.kr_stocks)}개) 🚀 고속모드")
        failed_kr_stocks = []
        successful_kr = 0
        
        for idx, stock in enumerate(self.kr_stocks, 1):
            symbol = stock['symbol']
            name = stock['name']

            print(f"[{idx}/{len(self.kr_stocks)}] {name} ({symbol}) Yahoo Finance 스크래핑...")
            
            try:
                results = self.calculate_indicators_for_stock(symbol, name, kr_dates, '^KS11')
                if results:
                    all_results.extend(results)
                    successful_kr += 1
                    print(f"  ✅ {symbol}: {len(results)}개 데이터 포인트 수집 성공")
                else:
                    failed_kr_stocks.append(f"{symbol} - {name}")
                    print(f"  ❌ {symbol}: 데이터 수집 실패")
                
                # 진행률 표시 (5% 단위)
                if idx % max(1, len(self.kr_stocks) // 20) == 0:
                    progress = (idx / len(self.kr_stocks)) * 100
                    success_rate = (successful_kr / idx) * 100
                    print(f"  📊 한국 주식 진행률: {progress:.1f}% ({idx}/{len(self.kr_stocks)}) | 성공률: {success_rate:.1f}%")
                    
            except Exception as e:
                print(f"  ❌ {symbol} 처리 실패: {e}")
                failed_kr_stocks.append(f"{symbol} - {name}")
                continue

            # 배치 처리: 웹 스크래핑 제한을 위한 대기 (최소화)
            if batch_size and idx % batch_size == 0:
                print(f"  ⏳ 배치 처리 대기 중... ({idx}/{len(self.kr_stocks)}) - 1초 대기")
                time.sleep(1)  # 고속 모드로 대기 시간 단축

        # 미국 주식 처리
        print(f"\n🇺🇸 미국 주식 Yahoo Finance 웹 스크래핑 처리 중... (총 {len(self.us_stocks)}개) 🚀 고속모드")
        failed_us_stocks = []
        successful_us = 0
        
        for idx, stock in enumerate(self.us_stocks, 1):
            symbol = stock['symbol']
            name = stock['name']

            print(f"[{idx}/{len(self.us_stocks)}] {name} ({symbol}) Yahoo Finance 스크래핑...")
            
            try:
                results = self.calculate_indicators_for_stock(symbol, name, us_dates, '^GSPC')
                if results:
                    all_results.extend(results)
                    successful_us += 1
                    print(f"  ✅ {symbol}: {len(results)}개 데이터 포인트 수집 성공")
                else:
                    failed_us_stocks.append(f"{symbol} - {name}")
                    print(f"  ❌ {symbol}: 데이터 수집 실패")
                
                # 진행률 표시 (5% 단위)
                if idx % max(1, len(self.us_stocks) // 20) == 0:
                    progress = (idx / len(self.us_stocks)) * 100
                    success_rate = (successful_us / idx) * 100
                    print(f"  📊 미국 주식 진행률: {progress:.1f}% ({idx}/{len(self.us_stocks)}) | 성공률: {success_rate:.1f}%")
                    
            except Exception as e:
                print(f"  ❌ {symbol} 처리 실패: {e}")
                failed_us_stocks.append(f"{symbol} - {name}")
                continue

            # 배치 처리: 웹 스크래핑 제한을 위한 대기 (최소화)
            if batch_size and idx % batch_size == 0:
                print(f"  ⏳ 배치 처리 대기 중... ({idx}/{len(self.us_stocks)}) - 1초 대기")
                time.sleep(1)  # 고속 모드로 대기 시간 단축

        # 실패한 종목 요약
        if failed_kr_stocks or failed_us_stocks:
            print(f"\n⚠️  Yahoo Finance 웹 스크래핑 실패한 종목들:")
            if failed_kr_stocks:
                print(f"  🇰🇷 한국 주식 ({len(failed_kr_stocks)}개): {', '.join(failed_kr_stocks[:5])}")
                if len(failed_kr_stocks) > 5:
                    print(f"    ... 및 {len(failed_kr_stocks) - 5}개 더")
            if failed_us_stocks:
                print(f"  🇺🇸 미국 주식 ({len(failed_us_stocks)}개): {', '.join(failed_us_stocks[:5])}")
                if len(failed_us_stocks) > 5:
                    print(f"    ... 및 {len(failed_us_stocks) - 5}개 더")

        # 데이터프레임으로 변환
        self.factor_model_data = pd.DataFrame(all_results)
        
        # 처리 결과 요약
        total_processed = len(self.kr_stocks) + len(self.us_stocks)
        total_failed = len(failed_kr_stocks) + len(failed_us_stocks)
        total_successful = successful_kr + successful_us
        success_rate = (total_successful / total_processed * 100) if total_processed > 0 else 0
        
        print(f"\n✅ Yahoo Finance 고속 웹 스크래핑 처리 완료!")
        print(f"  📈 총 종목: {total_processed}개")
        print(f"  ✅ 성공: {total_successful}개 (한국: {successful_kr}, 미국: {successful_us})")
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
        """전체 데이터 파이프라인을 실행합니다 - Yahoo Finance 웹 스크래핑 고속 모드"""
        print(f"시작 시간: {self.current_date.strftime('%Y-%m-%d %H:%M:%S')}")

        # 주식 목록 가져오기 (모든 주식)
        print("📊 모든 주식 처리 모드 - Yahoo Finance 웹 스크래핑 고속모드")
        self.get_korean_stocks()
        self.get_us_stocks()

        total_stocks = len(self.kr_stocks) + len(self.us_stocks)
        print(f"총 처리 예정 종목: {total_stocks:,}개 (한국: {len(self.kr_stocks)}, 미국: {len(self.us_stocks)})")
        
        # 예상 소요 시간 계산 (고속 모드로 종목당 평균 3초 가정)
        estimated_time = total_stocks * 3 / 60  # 분 단위
        print(f"예상 소요 시간: 약 {estimated_time:.1f}분 (고속 모드)")

        # 일별 지표 계산
        self.calculate_all_indicators(batch_size=self.batch_size)

        # 팩터 점수 계산
        self.calculate_factor_scores()

        # 데이터 저장
        self.save_data()

        # 총 실행 시간 출력
        elapsed_time = time.time() - self.start_time
        elapsed_minutes = elapsed_time / 60
        print(f"\n🎉 전체 고속 웹 스크래핑 처리 완료!")
        print(f"   총 실행 시간: {elapsed_time:.2f}초 ({elapsed_minutes:.1f}분)")
        print(f"   평균 종목당 시간: {elapsed_time/total_stocks:.2f}초" if total_stocks > 0 else "")

        return self.factor_model_data

# 실행 코드
if __name__ == "__main__":
    print("=== Daily 5-Factor Stock Model ===")
    print("Yahoo Finance 웹 스크래핑 전용 고속모드")
    print("=" * 60)
    
    print("\n📊 모든 종목 처리 모드 - Yahoo Finance 고속 스크래핑")
    print("🚀 네이버 백업 제거로 속도 향상")
    print("⚡ 최적화된 웹 스크래핑으로 빠른 처리")
    
    # 모든 주식 처리 모델 생성
    model = DailyStockFactorModel(batch_size=20)
    
    print("\n🚀 고속 웹 스크래핑 모델 실행 시작...")
    result = model.run_pipeline()
    
    print(f"\n📁 결과 파일이 생성되었습니다.")
    print(f"데이터 포인트: {len(result):,}개")
    print("고속 웹 스크래핑 처리 완료!") 