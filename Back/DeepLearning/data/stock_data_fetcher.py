"""
Stock Data Fetcher - 실제 한국/미국 주식 데이터 수집 모듈
"""

import pandas as pd
import yfinance as yf
from pykrx import stock
import requests
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import logging
from pathlib import Path
import warnings

# 경고 메시지 숨기기
warnings.filterwarnings('ignore')

# 로그 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StockDataFetcher:
    """실제 주식 데이터를 가져와서 CSV로 저장하는 클래스"""
    
    def __init__(self, output_dir: str = "."):
        """
        초기화
        
        Args:
            output_dir: CSV 파일을 저장할 디렉토리
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        self.korean_stocks = []
        self.us_stocks = []
        
    def fetch_korean_stocks(self) -> pd.DataFrame:
        """
        한국 주식 데이터를 가져옵니다.
        
        Returns:
            한국 주식 데이터 DataFrame
        """
        logger.info("한국 주식 데이터 수집 시작...")
        
        try:
            # KOSPI 종목 가져오기
            logger.info("KOSPI 종목 수집 중...")
            kospi_tickers = stock.get_market_ticker_list(market="KOSPI")
            kospi_stocks = []
            
            for ticker in kospi_tickers:
                try:
                    name = stock.get_market_ticker_name(ticker)
                    kospi_stocks.append({
                        'Code': ticker,
                        'Name': name,
                        'Market': 'KOSPI'
                    })
                except:
                    continue
            
            logger.info(f"KOSPI 종목 수집 완료: {len(kospi_stocks)}개")
            
            # KOSDAQ 종목 가져오기
            logger.info("KOSDAQ 종목 수집 중...")
            kosdaq_tickers = stock.get_market_ticker_list(market="KOSDAQ")
            kosdaq_stocks = []
            
            for ticker in kosdaq_tickers:
                try:
                    name = stock.get_market_ticker_name(ticker)
                    kosdaq_stocks.append({
                        'Code': ticker,
                        'Name': name,
                        'Market': 'KOSDAQ'
                    })
                except:
                    continue
            
            logger.info(f"KOSDAQ 종목 수집 완료: {len(kosdaq_stocks)}개")
            
            # KONEX 종목 가져오기 (있는 경우)
            try:
                logger.info("KONEX 종목 수집 중...")
                konex_tickers = stock.get_market_ticker_list(market="KONEX")
                konex_stocks = []
                
                for ticker in konex_tickers:
                    try:
                        name = stock.get_market_ticker_name(ticker)
                        konex_stocks.append({
                            'Code': ticker,
                            'Name': name,
                            'Market': 'KONEX'
                        })
                    except:
                        continue
                
                logger.info(f"KONEX 종목 수집 완료: {len(konex_stocks)}개")
            except:
                logger.warning("KONEX 종목 수집 실패 (존재하지 않을 수 있음)")
                konex_stocks = []
            
            # 모든 한국 주식 합치기
            all_korean_stocks = kospi_stocks + kosdaq_stocks + konex_stocks
            
            # DataFrame으로 변환
            df = pd.DataFrame(all_korean_stocks)
            
            # 시가총액 정보 추가 (최근 거래일 기준)
            logger.info("시가총액 정보 수집 중...")
            today = datetime.now().strftime("%Y%m%d")
            
            # 최근 거래일 찾기 (최대 7일 전까지)
            for i in range(7):
                date_str = (datetime.now() - timedelta(days=i)).strftime("%Y%m%d")
                try:
                    # KOSPI 시가총액
                    kospi_cap = stock.get_market_cap(date_str, market="KOSPI")
                    kosdaq_cap = stock.get_market_cap(date_str, market="KOSDAQ")
                    
                    if not kospi_cap.empty or not kosdaq_cap.empty:
                        logger.info(f"시가총액 데이터 날짜: {date_str}")
                        break
                except:
                    continue
            
            # 시가총액 정보 병합
            if not kospi_cap.empty:
                kospi_cap.reset_index(inplace=True)
                kospi_cap = kospi_cap[['티커', '시가총액']]
                kospi_cap.columns = ['Code', 'Marcap']
                df = df.merge(kospi_cap, on='Code', how='left')
            
            if not kosdaq_cap.empty:
                kosdaq_cap.reset_index(inplace=True)
                kosdaq_cap = kosdaq_cap[['티커', '시가총액']]
                kosdaq_cap.columns = ['Code', 'Marcap']
                df = df.merge(kosdaq_cap, on='Code', how='left', suffixes=('', '_kosdaq'))
                
                # KOSDAQ 시가총액으로 빈 값 채우기
                df['Marcap'] = df['Marcap'].fillna(df.get('Marcap_kosdaq', 0))
                if 'Marcap_kosdaq' in df.columns:
                    df.drop('Marcap_kosdaq', axis=1, inplace=True)
            
            # 시가총액이 없는 경우 0으로 설정
            if 'Marcap' not in df.columns:
                df['Marcap'] = 0
            
            self.korean_stocks = df
            
            logger.info(f"한국 주식 데이터 수집 완료: 총 {len(df)}개 종목")
            return df
            
        except Exception as e:
            logger.error(f"한국 주식 데이터 수집 실패: {e}")
            raise
    
    def fetch_us_stocks(self) -> pd.DataFrame:
        """
        미국 주식 데이터를 가져옵니다.
        
        Returns:
            미국 주식 데이터 DataFrame
        """
        logger.info("미국 주식 데이터 수집 시작...")
        
        try:
            us_stocks = []
            
            # NASDAQ 주식 목록 가져오기
            logger.info("NASDAQ 종목 수집 중...")
            nasdaq_url = "https://api.nasdaq.com/api/screener/stocks"
            nasdaq_params = {
                'tableonly': 'true',
                'limit': 10000,
                'download': 'true'
            }
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            try:
                response = requests.get(nasdaq_url, params=nasdaq_params, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    if 'data' in data and 'rows' in data['data']:
                        for stock in data['data']['rows']:
                            us_stocks.append({
                                'ACT Symbol': stock['symbol'],
                                'Company Name': stock['name'],
                                'Market': 'NASDAQ'
                            })
                        logger.info(f"NASDAQ 종목 수집 완료: {len(data['data']['rows'])}개")
            except Exception as e:
                logger.warning(f"NASDAQ API 접근 실패: {e}")
            
            # yfinance를 사용한 대안 방법
            if len(us_stocks) < 1000:  # NASDAQ API가 실패한 경우
                logger.info("yfinance를 사용하여 미국 주식 목록 수집...")
                
                # 주요 미국 주식들의 심볼 리스트 (샘플)
                major_symbols = [
                    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'TSLA', 'META', 'NVDA', 
                    'BRK-B', 'UNH', 'JNJ', 'V', 'PG', 'JPM', 'HD', 'MA', 'BAC', 'ABBV',
                    'PFE', 'KO', 'AVGO', 'PEP', 'TMO', 'COST', 'WMT', 'DIS', 'ABT', 'DHR',
                    'VZ', 'ADBE', 'NFLX', 'CRM', 'ACN', 'NKE', 'LLY', 'TXN', 'ORCL', 'WFC',
                    'AMD', 'QCOM', 'BMY', 'NEE', 'PM', 'HON', 'UPS', 'T', 'SBUX', 'LOW',
                    'IBM', 'GS', 'INTC', 'CAT', 'GE', 'MDT', 'BA', 'AXP', 'BLK', 'DE'
                ]
                
                # S&P 500 심볼 목록 가져오기 (Wikipedia)
                try:
                    sp500_url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
                    sp500_table = pd.read_html(sp500_url)[0]
                    sp500_symbols = sp500_table['Symbol'].tolist()
                    major_symbols.extend(sp500_symbols)
                    logger.info(f"S&P 500 심볼 추가: {len(sp500_symbols)}개")
                except Exception as e:
                    logger.warning(f"S&P 500 목록 가져오기 실패: {e}")
                
                # 중복 제거
                major_symbols = list(set(major_symbols))
                
                # yfinance로 각 심볼의 정보 가져오기
                for i, symbol in enumerate(major_symbols):
                    try:
                        if i % 50 == 0:
                            logger.info(f"진행률: {i}/{len(major_symbols)}")
                        
                        ticker = yf.Ticker(symbol)
                        info = ticker.info
                        
                        if 'longName' in info or 'shortName' in info:
                            name = info.get('longName', info.get('shortName', symbol))
                            exchange = info.get('exchange', 'Unknown')
                            
                            # 주요 거래소만 포함
                            if exchange in ['NMS', 'NGM', 'NYQ', 'NASDAQ', 'NYSE']:
                                market = 'NASDAQ' if exchange in ['NMS', 'NGM', 'NASDAQ'] else 'NYSE'
                                us_stocks.append({
                                    'ACT Symbol': symbol,
                                    'Company Name': name,
                                    'Market': market
                                })
                        
                        # API 제한을 위한 딜레이
                        time.sleep(0.1)
                        
                    except Exception as e:
                        continue
                
                logger.info(f"yfinance로 수집 완료: {len(us_stocks)}개")
            
            # DataFrame으로 변환
            df = pd.DataFrame(us_stocks)
            
            # 중복 제거
            df = df.drop_duplicates(subset=['ACT Symbol']).reset_index(drop=True)
            
            self.us_stocks = df
            
            logger.info(f"미국 주식 데이터 수집 완료: 총 {len(df)}개 종목")
            return df
            
        except Exception as e:
            logger.error(f"미국 주식 데이터 수집 실패: {e}")
            raise
    
    def save_to_csv(self, korean_df: pd.DataFrame = None, us_df: pd.DataFrame = None) -> None:
        """
        수집한 데이터를 CSV 파일로 저장합니다.
        
        Args:
            korean_df: 한국 주식 DataFrame
            us_df: 미국 주식 DataFrame
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 한국 주식 저장
        if korean_df is not None and not korean_df.empty:
            korean_file = self.output_dir / f"KR_Stock_Master_{timestamp}.csv"
            korean_df.to_csv(korean_file, index=False, encoding='utf-8-sig')
            logger.info(f"한국 주식 데이터 저장: {korean_file}")
            
            # 최신 파일로도 저장
            latest_korean_file = self.output_dir / "KR_Stock_Master.csv"
            korean_df.to_csv(latest_korean_file, index=False, encoding='utf-8-sig')
        
        # 미국 주식 저장
        if us_df is not None and not us_df.empty:
            us_file = self.output_dir / f"US_Stock_Master_{timestamp}.csv"
            us_df.to_csv(us_file, index=False, encoding='utf-8-sig')
            logger.info(f"미국 주식 데이터 저장: {us_file}")
            
            # 최신 파일로도 저장
            latest_us_file = self.output_dir / "US_Stock_Master.csv"
            us_df.to_csv(latest_us_file, index=False, encoding='utf-8-sig')
    
    def fetch_all_stocks(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        모든 주식 데이터를 가져와서 CSV로 저장합니다.
        
        Returns:
            (한국 주식 DataFrame, 미국 주식 DataFrame)
        """
        logger.info("전체 주식 데이터 수집 시작...")
        
        # 한국 주식 수집
        korean_df = self.fetch_korean_stocks()
        
        # 미국 주식 수집
        us_df = self.fetch_us_stocks()
        
        # CSV로 저장
        self.save_to_csv(korean_df, us_df)
        
        # 통계 출력
        self.print_statistics(korean_df, us_df)
        
        logger.info("전체 주식 데이터 수집 완료!")
        
        return korean_df, us_df
    
    def print_statistics(self, korean_df: pd.DataFrame, us_df: pd.DataFrame) -> None:
        """수집 통계를 출력합니다."""
        print("\n" + "="*50)
        print("📊 주식 데이터 수집 통계")
        print("="*50)
        
        if korean_df is not None and not korean_df.empty:
            print(f"🇰🇷 한국 주식: {len(korean_df):,}개")
            if 'Market' in korean_df.columns:
                market_counts = korean_df['Market'].value_counts()
                for market, count in market_counts.items():
                    print(f"   - {market}: {count:,}개")
        
        if us_df is not None and not us_df.empty:
            print(f"🇺🇸 미국 주식: {len(us_df):,}개")
            if 'Market' in us_df.columns:
                market_counts = us_df['Market'].value_counts()
                for market, count in market_counts.items():
                    print(f"   - {market}: {count:,}개")
        
        total = len(korean_df) + len(us_df)
        print(f"📈 총 종목 수: {total:,}개")
        print("="*50)
    
    def update_existing_data(self) -> None:
        """기존 데이터를 업데이트합니다."""
        logger.info("기존 데이터 업데이트 시작...")
        
        # 기존 파일 백업
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        kr_file = self.output_dir / "KR_Stock_Master.csv"
        us_file = self.output_dir / "US_Stock_Master.csv"
        
        if kr_file.exists():
            backup_kr = self.output_dir / f"KR_Stock_Master_backup_{timestamp}.csv"
            kr_file.rename(backup_kr)
            logger.info(f"한국 주식 데이터 백업: {backup_kr}")
        
        if us_file.exists():
            backup_us = self.output_dir / f"US_Stock_Master_backup_{timestamp}.csv"
            us_file.rename(backup_us)
            logger.info(f"미국 주식 데이터 백업: {backup_us}")
        
        # 새 데이터 수집
        self.fetch_all_stocks()

# 편의 함수들
def fetch_korean_stocks_only(output_dir: str = "data") -> pd.DataFrame:
    """한국 주식만 수집하는 함수"""
    fetcher = StockDataFetcher(output_dir)
    return fetcher.fetch_korean_stocks()

def fetch_us_stocks_only(output_dir: str = "data") -> pd.DataFrame:
    """미국 주식만 수집하는 함수"""
    fetcher = StockDataFetcher(output_dir)
    return fetcher.fetch_us_stocks()

def fetch_all_stocks(output_dir: str = ".") -> Tuple[pd.DataFrame, pd.DataFrame]:
    """모든 주식을 수집하는 함수"""
    fetcher = StockDataFetcher(output_dir)
    return fetcher.fetch_all_stocks()

# 사용 예시
if __name__ == "__main__":
    print("🚀 Stock Data Fetcher - 실시간 주식 데이터 수집기")
    print("=" * 60)
    
    # 데이터 수집기 생성 (현재 디렉토리에 저장)
    fetcher = StockDataFetcher(".")
    
    # 모든 주식 데이터 수집
    korean_stocks, us_stocks = fetcher.fetch_all_stocks()
    
    print("\n✅ 데이터 수집이 완료되었습니다!")
    print(f"📁 저장 위치: {fetcher.output_dir.absolute()}")
    print("\n📋 생성된 파일:")
    print("- KR_Stock_Master.csv (한국 주식)")
    print("- US_Stock_Master.csv (미국 주식)")
    print("- 타임스탬프가 포함된 백업 파일들") 