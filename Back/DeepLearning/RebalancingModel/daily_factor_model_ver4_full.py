"""
일별 5팩터 주식 모델 Ver4 - 전체 종목 처리 버전

주요 기능:
1. KR_Stock_Master.csv와 US_Stock_Master.csv 전체 종목 처리
2. 배치 처리 및 중간 저장
3. 에러 처리 강화 및 재시도 로직
4. 진행 상태 추적 및 재개 기능
"""

import yfinance as yf
import numpy as np
import pandas as pd
import requests
from bs4 import BeautifulSoup
import time
import json
from datetime import datetime, timedelta
import concurrent.futures
import warnings
import re
import os
warnings.filterwarnings('ignore')

class FullStockDataCollector:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.usd_krw_rate = None  # 환율 캐시
        self.processed_count = 0
        self.error_count = 0
        
        # 폴더 경로 설정
        self.today_str = datetime.now().strftime("%Y%m%d")
        self.preprocessing_dir = "preprocessing"
        self.today_dir = os.path.join(self.preprocessing_dir, self.today_str)
        
        # 폴더 생성
        self.create_directories()
        
    def create_directories(self):
        """필요한 디렉토리 생성"""
        try:
            os.makedirs(self.preprocessing_dir, exist_ok=True)
            os.makedirs(self.today_dir, exist_ok=True)
            print(f"📁 폴더 생성 완료:")
            print(f"   - {self.preprocessing_dir}/")
            print(f"   - {self.today_dir}/")
        except Exception as e:
            print(f"❌ 폴더 생성 실패: {e}")
        
    def get_usd_krw_rate(self):
        """USD/KRW 환율 가져오기 (캐시 활용)"""
        if self.usd_krw_rate is not None:
            return self.usd_krw_rate
            
        try:
            print(f"💱 USD/KRW 환율 가져오는 중...")
            
            url = "https://query1.finance.yahoo.com/v8/finance/chart/USDKRW=X"
            params = {
                'period1': 0,
                'period2': 9999999999,
                'interval': '1d'
            }
            
            response = self.session.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'chart' in data and 'result' in data['chart'] and data['chart']['result']:
                    result = data['chart']['result'][0]
                    meta = result.get('meta', {})
                    current_rate = meta.get('regularMarketPrice')
                    
                    if current_rate:
                        self.usd_krw_rate = current_rate
                        print(f"✅ USD/KRW 환율: {current_rate:.2f}")
                        return current_rate
            
            print(f"⚠️ 환율 API 실패 - 기본값 1370 사용")
            self.usd_krw_rate = 1370
            return 1370
            
        except Exception as e:
            print(f"❌ 환율 가져오기 실패: {e} - 기본값 1370 사용")
            self.usd_krw_rate = 1370
            return 1370
    
    def convert_to_usd(self, amount, currency):
        """통화를 USD로 변환"""
        if currency == 'USD':
            return amount
        elif currency == 'KRW':
            usd_krw_rate = self.get_usd_krw_rate()
            return amount / usd_krw_rate
        else:
            return amount
    
    def get_chart_data_fast(self, symbol):
        """Yahoo Chart API로 빠르게 주가 데이터 수집"""
        try:
            end_time = int(time.time())
            start_time = end_time - (365 * 24 * 60 * 60)  # 1년 전
            
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
            params = {
                'period1': start_time,
                'period2': end_time,
                'interval': '1d',
                'includePrePost': 'false'
            }
            
            response = self.session.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'chart' in data and 'result' in data['chart'] and data['chart']['result']:
                    result = data['chart']['result'][0]
                    
                    timestamps = result['timestamp']
                    prices = result['indicators']['quote'][0]
                    
                    df = pd.DataFrame({
                        'Date': pd.to_datetime(timestamps, unit='s'),
                        'Open': prices['open'],
                        'High': prices['high'],
                        'Low': prices['low'],
                        'Close': prices['close'],
                        'Volume': prices['volume']
                    })
                    
                    meta = result.get('meta', {})
                    current_price = meta.get('regularMarketPrice')
                    currency = meta.get('currency')
                    
                    return df, current_price, currency
                    
            return None, None, None
            
        except Exception as e:
            return None, None, None
    
    def get_fundamental_data_lite(self, symbol):
        """필수 펀더멘털 데이터만 빠르게 수집"""
        try:
            url = f"https://finance.yahoo.com/quote/{symbol}/"
            response = self.session.get(url, timeout=8)
            
            if response.status_code != 200:
                return None
            
            html_content = response.text
            info = {}
            
            # 베타값 찾기
            beta_patterns = [
                r'"beta":\s*\{\s*"raw":\s*([0-9.]+)',
                r'"beta":\s*([0-9.]+)',
                r'beta.*?([0-9]\.[0-9]+)',
            ]
            
            for i, pattern in enumerate(beta_patterns):
                matches = re.findall(pattern, html_content, re.IGNORECASE)
                if matches:
                    try:
                        for match in matches:
                            beta_value = float(match)
                            if 0.1 < beta_value < 5.0:
                                info['beta'] = beta_value
                                break
                        if 'beta' in info:
                            break
                    except ValueError:
                        continue
            
            # PBR 찾기
            pbr_patterns = [
                r'"priceToBook":\s*\{\s*"raw":\s*([0-9.]+)',
                r'"priceToBook":\s*([0-9.]+)',
                r'Price/Book.*?([0-9]\.[0-9]+)',
            ]
            
            for i, pattern in enumerate(pbr_patterns):
                matches = re.findall(pattern, html_content, re.IGNORECASE)
                if matches:
                    try:
                        for match in matches:
                            pbr_value = float(match)
                            if 0.1 < pbr_value < 50:
                                info['priceToBook'] = pbr_value
                                break
                        if 'priceToBook' in info:
                            break
                    except ValueError:
                        continue
            
            # 시가총액 찾기
            cap_patterns = [
                r'Market Cap[^>]*>\s*([0-9,.]+[KMBT])\s*<',
                r'>([0-9,.]+[KMBT])\s*</fin-streamer>',
                r'marketCap.*?([0-9,.]+[KMBT])',
                r'"marketCap":\s*\{\s*"raw":\s*([0-9.]+)',
            ]
            
            for i, pattern in enumerate(cap_patterns):
                matches = re.findall(pattern, html_content, re.IGNORECASE)
                if matches:
                    try:
                        for match in matches:
                            if i < 3:  # 텍스트 형태
                                cap_value = self.parse_market_cap_text(match)
                                if cap_value:
                                    info['marketCap'] = cap_value
                                    break
                            else:  # JSON 숫자
                                cap_value = float(match)
                                if cap_value > 1000000:
                                    info['marketCap'] = cap_value
                                    break
                        if 'marketCap' in info:
                            break
                    except ValueError:
                        continue
            
            return info if info else None
            
        except Exception as e:
            return None
    
    def parse_market_cap_text(self, cap_text):
        """시가총액 텍스트 파싱"""
        try:
            cap_text = cap_text.replace(',', '').upper()
            
            if 'T' in cap_text:
                return float(cap_text.replace('T', '')) * 1e12
            elif 'B' in cap_text:
                return float(cap_text.replace('B', '')) * 1e9
            elif 'M' in cap_text:
                return float(cap_text.replace('M', '')) * 1e6
            elif 'K' in cap_text:
                return float(cap_text.replace('K', '')) * 1e3
            
            return None
        except:
            return None

def calculate_5_factor_model_optimized(price_data, market_data, fundamental_info):
    """5팩터 모델 계산 (최적화)"""
    
    if len(price_data) < 30:
        return None
    
    returns = price_data['Close'].pct_change().dropna()
    
    if len(returns) == 0:
        return None
    
    current_price = price_data['Close'].iloc[-1]
    volatility = returns.std() * np.sqrt(252)
    
    # 베타
    beta = 1.0
    if market_data is not None and len(market_data) >= len(returns):
        market_returns = market_data['Close'].pct_change().dropna()
        if len(market_returns) >= len(returns):
            min_len = min(len(returns), len(market_returns))
            stock_ret = returns.iloc[-min_len:]
            market_ret = market_returns.iloc[-min_len:]
            
            covariance = np.cov(stock_ret, market_ret)[0, 1]
            market_variance = np.var(market_ret)
            if market_variance > 0:
                beta = covariance / market_variance
    
    if fundamental_info and 'beta' in fundamental_info:
        beta = fundamental_info['beta']
    
    # SMB
    smb_score = 0
    if fundamental_info and 'marketCap' in fundamental_info:
        market_cap = fundamental_info['marketCap']
        if market_cap < 2e9:
            smb_score = 1
        elif market_cap > 10e9:
            smb_score = -1
    
    # HML
    hml_score = 0
    if fundamental_info and 'priceToBook' in fundamental_info:
        pbr = fundamental_info['priceToBook']
        if pbr > 3:
            hml_score = -1
        elif pbr < 1:
            hml_score = 1
    
    # RMW
    rmw_score = 0
    if len(returns) >= 60:
        recent_returns = returns.iloc[-60:].mean()
        if recent_returns > 0.01:
            rmw_score = 1
        elif recent_returns < -0.01:
            rmw_score = -1
    
    # CMA
    cma_score = 0
    if volatility < 0.2:
        cma_score = 1
    elif volatility > 0.4:
        cma_score = -1
    
    # 종합 스코어
    composite_score = (
        beta * 0.3 +
        smb_score * 0.2 +
        hml_score * 0.2 +
        rmw_score * 0.15 +
        cma_score * 0.15
    )
    
    factors = {
        'beta': beta,
        'smb': smb_score,
        'hml': hml_score, 
        'rmw': rmw_score,
        'cma': cma_score,
        'volatility': volatility,
        'current_price': current_price,
        'composite_score': composite_score
    }
    
    return factors

def process_single_stock_optimized(symbol, collector, market_data=None, retry_count=0):
    """개별 주식 최적화 처리 (에러 처리 강화)"""
    max_retries = 2
    
    try:
        # 주가 데이터 수집
        price_data, current_price, currency = collector.get_chart_data_fast(symbol)
        
        if price_data is None or len(price_data) < 30:
            return None
        
        # 펀더멘털 데이터 수집
        fundamental_info = collector.get_fundamental_data_lite(symbol)
        if fundamental_info is None:
            fundamental_info = {}
        
        # 5팩터 모델 계산
        factors = calculate_5_factor_model_optimized(price_data, market_data, fundamental_info)
        
        if factors is None:
            return None
        
        # 결과 정리
        result = {
            'symbol': symbol,
            'current_price': factors['current_price'],
            'currency': currency,
            'beta': factors['beta'],
            'smb_score': factors['smb'],
            'hml_score': factors['hml'],
            'rmw_score': factors['rmw'],
            'cma_score': factors['cma'],
            'volatility': factors['volatility'],
            'composite_score': factors['composite_score'],
            'market_cap': fundamental_info.get('marketCap', 'N/A'),
            'pbr': fundamental_info.get('priceToBook', 'N/A')
        }
        
        # 시가총액 USD 변환
        if fundamental_info.get('marketCap') != 'N/A' and fundamental_info.get('marketCap') is not None:
            market_cap_usd = collector.convert_to_usd(fundamental_info['marketCap'], currency)
            result['market_cap_usd'] = market_cap_usd
        
        return result
        
    except Exception as e:
        if retry_count < max_retries:
            time.sleep(1)  # 1초 대기 후 재시도
            return process_single_stock_optimized(symbol, collector, market_data, retry_count + 1)
        else:
            print(f"❌ {symbol}: 최대 재시도 초과 - {e}")
            return None

def load_stock_masters():
    """주식 마스터 파일들 로드"""
    try:
        # 한국 주식
        kr_stocks = pd.read_csv('../data/KR_Stock_Master.csv')
        kr_symbols = [f"{code}.KS" for code in kr_stocks['Code'].astype(str)]
        
        # 미국 주식  
        us_stocks = pd.read_csv('../data/US_Stock_Master.csv')
        us_symbols = us_stocks['ACT Symbol'].tolist()
        
        print(f"📊 한국 주식: {len(kr_symbols):,}개")
        print(f"📊 미국 주식: {len(us_symbols):,}개")
        print(f"📊 총 종목: {len(kr_symbols) + len(us_symbols):,}개")
        
        return kr_symbols, us_symbols
        
    except Exception as e:
        print(f"❌ 주식 마스터 파일 로드 실패: {e}")
        return [], []

def save_batch_results(results, batch_num, region, today_dir):
    """배치 결과 저장 (날짜별 폴더에)"""
    if not results:
        return None
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"factor_analysis_{region}_batch{batch_num}_{timestamp}.csv"
    filepath = os.path.join(today_dir, filename)
    
    df = pd.DataFrame(results)
    df.to_csv(filepath, index=False, encoding='utf-8-sig')
    
    print(f"💾 배치 {batch_num} 저장: {filename} ({len(results)}개 종목)")
    return filepath

def run_full_factor_model():
    """전체 종목 5팩터 모델 실행"""
    
    print("🚀 일별 5팩터 주식 모델 Ver4 - 전체 종목 처리 시작!")
    print("=" * 80)
    
    # 주식 마스터 로드
    kr_symbols, us_symbols = load_stock_masters()
    
    if not kr_symbols and not us_symbols:
        print("❌ 처리할 종목이 없습니다.")
        return
    
    # 데이터 수집기 초기화
    collector = FullStockDataCollector()
    
    # 시장 지수 데이터
    print("📊 시장 지수 데이터 수집 중...")
    market_data, _, _ = collector.get_chart_data_fast('^KS11')  # KOSPI
    
    if market_data is not None:
        print(f"✅ KOSPI 데이터 수집 완료 ({len(market_data)}일)")
    else:
        print("⚠️ KOSPI 데이터 수집 실패")
    
    # 배치 크기 설정
    batch_size = 100
    
    # 전체 결과 저장용
    all_final_results = []
    
    # 한국 주식 처리
    if kr_symbols:
        print(f"\n🇰🇷 한국 주식 처리 시작 ({len(kr_symbols):,}개)")
        kr_results = process_region_stocks(kr_symbols, collector, market_data, "KR", batch_size)
        all_final_results.extend(kr_results)
    
    # 미국 주식 처리 (전체)
    if us_symbols:
        print(f"\n🇺🇸 미국 주식 처리 시작 ({len(us_symbols):,}개)")
        us_results = process_region_stocks(us_symbols, collector, None, "US", batch_size)
        all_final_results.extend(us_results)
    
    # 통합본 저장
    if all_final_results:
        save_combined_results(all_final_results, collector.preprocessing_dir)
    
    print(f"\n🎉 전체 5팩터 모델 분석 완료!")
    print(f"📊 최종 결과: {len(all_final_results):,}개 종목 성공")

def save_combined_results(all_results, preprocessing_dir):
    """통합 결과를 factor_analysis.csv로 저장"""
    try:
        combined_filepath = os.path.join(preprocessing_dir, "factor_analysis.csv")
        df = pd.DataFrame(all_results)
        df.to_csv(combined_filepath, index=False, encoding='utf-8-sig')
        
        print(f"\n📋 통합본 저장 완료:")
        print(f"   파일: {combined_filepath}")
        print(f"   종목수: {len(all_results):,}개")
        
        # 요약 통계
        kr_count = len([r for r in all_results if r['symbol'].endswith('.KS')])
        us_count = len(all_results) - kr_count
        
        print(f"   - 한국 주식: {kr_count:,}개")
        print(f"   - 미국 주식: {us_count:,}개")
        
    except Exception as e:
        print(f"❌ 통합본 저장 실패: {e}")

def process_region_stocks(symbols, collector, market_data, region, batch_size):
    """지역별 주식 배치 처리"""
    total_batches = (len(symbols) + batch_size - 1) // batch_size
    all_results = []
    
    for batch_num in range(total_batches):
        start_idx = batch_num * batch_size
        end_idx = min(start_idx + batch_size, len(symbols))
        batch_symbols = symbols[start_idx:end_idx]
        
        print(f"\n📦 {region} 배치 {batch_num + 1}/{total_batches} 처리 중...")
        print(f"   종목 범위: {start_idx + 1}-{end_idx} ({len(batch_symbols)}개)")
        
        batch_results = []
        success_count = 0
        
        for i, symbol in enumerate(batch_symbols, 1):
            result = process_single_stock_optimized(symbol, collector, market_data)
            
            if result:
                batch_results.append(result)
                success_count += 1
            
            # 진행률 표시 (10개마다)
            if i % 10 == 0 or i == len(batch_symbols):
                print(f"   진행률: {i}/{len(batch_symbols)} ({i/len(batch_symbols)*100:.1f}%) | 성공: {success_count}")
            
            # API 부하 방지
            time.sleep(0.1)
        
        # 배치 결과 저장
        if batch_results:
            save_batch_results(batch_results, batch_num + 1, region, collector.today_dir)
            all_results.extend(batch_results)
        
        print(f"✅ 배치 {batch_num + 1} 완료: {success_count}/{len(batch_symbols)} 성공")
        
        # 배치 간 대기
        if batch_num < total_batches - 1:
            print(f"⏳ 다음 배치까지 1초 대기...")
            time.sleep(1)
    
    print(f"\n🎯 {region} 지역 완료: {len(all_results):,}개 종목 성공")
    return all_results

if __name__ == "__main__":
    start_time = time.time()
    run_full_factor_model()
    end_time = time.time()
    
    print(f"\n⏱️ 총 실행 시간: {(end_time - start_time)/60:.1f}분") 