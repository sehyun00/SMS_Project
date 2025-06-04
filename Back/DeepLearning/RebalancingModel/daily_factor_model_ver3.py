"""
일별 5팩터 주식 모델 Ver3 - Yahoo Chart API 활용 최적화 버전

주요 개선사항:
1. Yahoo Chart API 활용 (crumb 불필요) - 주가 데이터
2. 필수 정보만 스크래핑으로 보완 - 베타, PBR 등
3. 처리 속도 대폭 향상
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
warnings.filterwarnings('ignore')

class OptimizedStockDataCollector:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.usd_krw_rate = None  # 환율 캐시
    
    def get_usd_krw_rate(self):
        """USD/KRW 환율 가져오기 (캐시 활용)"""
        if self.usd_krw_rate is not None:
            return self.usd_krw_rate
            
        try:
            print(f"💱 USD/KRW 환율 가져오는 중...")
            
            # Yahoo Finance Chart API로 USD/KRW 환율
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
            
            # 실패시 기본값
            print(f"⚠️ 환율 API 실패 - 기본값 1300 사용")
            self.usd_krw_rate = 1300
            return 1300
            
        except Exception as e:
            print(f"❌ 환율 가져오기 실패: {e} - 기본값 1300 사용")
            self.usd_krw_rate = 1300
            return 1300
    
    def convert_to_usd(self, amount, currency):
        """통화를 USD로 변환"""
        if currency == 'USD':
            return amount
        elif currency == 'KRW':
            usd_krw_rate = self.get_usd_krw_rate()
            return amount / usd_krw_rate
        else:
            # 기타 통화는 그대로 (향후 확장 가능)
            return amount
    
    def get_chart_data_fast(self, symbol):
        """Yahoo Chart API로 빠르게 주가 데이터 수집"""
        try:
            # 1년간 일별 데이터
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
                    
                    # 타임스탬프와 가격 데이터
                    timestamps = result['timestamp']
                    prices = result['indicators']['quote'][0]
                    
                    # DataFrame 생성
                    df = pd.DataFrame({
                        'Date': pd.to_datetime(timestamps, unit='s'),
                        'Open': prices['open'],
                        'High': prices['high'],
                        'Low': prices['low'],
                        'Close': prices['close'],
                        'Volume': prices['volume']
                    })
                    
                    # 메타 정보
                    meta = result.get('meta', {})
                    current_price = meta.get('regularMarketPrice')
                    currency = meta.get('currency')
                    
                    return df, current_price, currency
                    
            return None, None, None
            
        except Exception as e:
            print(f"❌ {symbol}: Chart API 에러 - {e}")
            return None, None, None
    
    def get_fundamental_data_lite(self, symbol):
        """필수 펀더멘털 데이터만 빠르게 수집 (상세 로그 포함)"""
        try:
            print(f"🔍 {symbol}: Yahoo Finance 페이지 접속 중...")
            
            # Yahoo Finance 정보 페이지
            url = f"https://finance.yahoo.com/quote/{symbol}/"
            response = self.session.get(url, timeout=8)
            
            if response.status_code != 200:
                print(f"❌ {symbol}: Yahoo Finance 페이지 접속 실패 (상태코드: {response.status_code})")
                return None
            
            print(f"✅ {symbol}: Yahoo Finance 페이지 접속 성공")
            html_content = response.text
            info = {}
            
            # 베타값 찾기 (정확한 JSON 패턴)
            print(f"🔍 {symbol}: 베타값 검색 중...")
            beta_patterns = [
                r'"beta":\s*\{\s*"raw":\s*([0-9.]+)',  # {"raw":1.211}
                r'"beta":\s*([0-9.]+)',                # 단순 숫자
                r'beta.*?([0-9]\.[0-9]+)',             # 주변 텍스트 포함
            ]
            
            beta_found = False
            for i, pattern in enumerate(beta_patterns):
                matches = re.findall(pattern, html_content, re.IGNORECASE)
                if matches:
                    try:
                        # 첫 번째 유효한 베타값 사용
                        for match in matches:
                            beta_value = float(match)
                            if 0.1 < beta_value < 5.0:  # 합리적 베타 범위
                                info['beta'] = beta_value
                                print(f"✅ {symbol}: Yahoo에서 베타값 {beta_value} 가져옴 (패턴 {i+1})")
                                beta_found = True
                                break
                        if beta_found:
                            break
                    except ValueError:
                        continue
            
            if not beta_found:
                print(f"⚠️ {symbol}: 베타값 없음 - 기본값 1.0 사용")
            
            # PBR 찾기 (정확한 JSON 패턴)
            print(f"🔍 {symbol}: PBR값 검색 중...")
            pbr_patterns = [
                r'"priceToBook":\s*\{\s*"raw":\s*([0-9.]+)',  # {"raw":1.5}
                r'"priceToBook":\s*([0-9.]+)',                # 단순 숫자
                r'Price/Book.*?([0-9]\.[0-9]+)',              # 텍스트 포함
            ]
            
            pbr_found = False
            for i, pattern in enumerate(pbr_patterns):
                matches = re.findall(pattern, html_content, re.IGNORECASE)
                if matches:
                    try:
                        for match in matches:
                            pbr_value = float(match)
                            if 0.1 < pbr_value < 50:  # 합리적 PBR 범위
                                info['priceToBook'] = pbr_value
                                print(f"✅ {symbol}: Yahoo에서 PBR값 {pbr_value} 가져옴 (패턴 {i+1})")
                                pbr_found = True
                                break
                        if pbr_found:
                            break
                    except ValueError:
                        continue
            
            if not pbr_found:
                print(f"⚠️ {symbol}: PBR값 없음 - 기본값 사용")
            
            # 시가총액 찾기 (정확한 HTML 텍스트 패턴)
            print(f"🔍 {symbol}: 시가총액 검색 중...")
            cap_patterns = [
                r'Market Cap[^>]*>\s*([0-9,.]+[KMBT])\s*<',    # HTML 태그 사이의 정확한 값
                r'>([0-9,.]+[KMBT])\s*</fin-streamer>',        # fin-streamer 태그 내의 값
                r'marketCap.*?([0-9,.]+[KMBT])',               # 일반적인 텍스트 매치
                r'"marketCap":\s*\{\s*"raw":\s*([0-9.]+)',     # JSON {"raw":123456789} (보조)
            ]
            
            market_cap_found = False
            for i, pattern in enumerate(cap_patterns):
                matches = re.findall(pattern, html_content, re.IGNORECASE)
                if matches:
                    try:
                        for match in matches:
                            if i < 3:  # 텍스트 형태 (1.5T, 500B 등) - 주요 방법들
                                cap_value = self.parse_market_cap_text(match)
                                if cap_value:
                                    info['marketCap'] = cap_value
                                    print(f"✅ {symbol}: Yahoo에서 시가총액 {match} ({cap_value:,.0f}) 가져옴 (패턴 {i+1})")
                                    market_cap_found = True
                                    break
                            else:  # JSON 숫자만 있는 경우 (보조 방법)
                                cap_value = float(match)
                                if cap_value > 1000000:  # 100만 이상만 유효
                                    info['marketCap'] = cap_value
                                    print(f"✅ {symbol}: Yahoo에서 시가총액 {cap_value:,.0f} 가져옴 (패턴 {i+1})")
                                    market_cap_found = True
                                    break
                        if market_cap_found:
                            break
                    except ValueError:
                        continue
            
            if not market_cap_found:
                print(f"⚠️ {symbol}: 시가총액 없음 - 기본값 사용")
            
            return info if info else None
            
        except Exception as e:
            print(f"❌ {symbol}: 펀더멘털 데이터 수집 에러 - {e}")
            return None
    
    def parse_market_cap_text(self, cap_text):
        """시가총액 텍스트 파싱 (예: 1.5T, 500B)"""
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
    """최적화된 5팩터 모델 계산"""
    
    if len(price_data) < 30:  # 최소 30일 데이터 필요
        return None
    
    # 수익률 계산
    returns = price_data['Close'].pct_change().dropna()
    
    if len(returns) == 0:
        return None
    
    # 기본 지표들
    current_price = price_data['Close'].iloc[-1]
    volatility = returns.std() * np.sqrt(252)  # 연환산 변동성
    
    # 베타 (시장 데이터가 있는 경우)
    beta = 1.0  # 기본값
    if market_data is not None and len(market_data) >= len(returns):
        market_returns = market_data['Close'].pct_change().dropna()
        if len(market_returns) >= len(returns):
            # 길이 맞추기
            min_len = min(len(returns), len(market_returns))
            stock_ret = returns.iloc[-min_len:]
            market_ret = market_returns.iloc[-min_len:]
            
            # 베타 계산
            covariance = np.cov(stock_ret, market_ret)[0, 1]
            market_variance = np.var(market_ret)
            if market_variance > 0:
                beta = covariance / market_variance
    
    # 펀더멘털에서 베타 우선 사용
    if fundamental_info and 'beta' in fundamental_info:
        beta = fundamental_info['beta']
    
    # SMB (Small Minus Big) - 시가총액 기반
    smb_score = 0
    if fundamental_info and 'marketCap' in fundamental_info:
        market_cap = fundamental_info['marketCap']
        if market_cap < 2e9:  # 20억 달러 미만
            smb_score = 1
        elif market_cap > 10e9:  # 100억 달러 초과
            smb_score = -1
    
    # HML (High Minus Low) - PBR 기반
    hml_score = 0
    if fundamental_info and 'priceToBook' in fundamental_info:
        pbr = fundamental_info['priceToBook']
        if pbr > 3:  # 고PBR
            hml_score = -1
        elif pbr < 1:  # 저PBR
            hml_score = 1
    
    # RMW (Robust Minus Weak) - 간단한 수익성 지표
    rmw_score = 0
    if len(returns) >= 60:  # 2개월 이상 데이터
        recent_returns = returns.iloc[-60:].mean()  # 최근 2개월 평균 수익률
        if recent_returns > 0.01:  # 1% 이상
            rmw_score = 1
        elif recent_returns < -0.01:  # -1% 미만
            rmw_score = -1
    
    # CMA (Conservative Minus Aggressive) - 변동성 기반
    cma_score = 0
    if volatility < 0.2:  # 20% 미만 (보수적)
        cma_score = 1
    elif volatility > 0.4:  # 40% 초과 (공격적)
        cma_score = -1
    
    # 종합 스코어 계산
    factors = {
        'beta': beta,
        'smb': smb_score,
        'hml': hml_score, 
        'rmw': rmw_score,
        'cma': cma_score,
        'volatility': volatility,
        'current_price': current_price
    }
    
    # 5팩터 종합 점수 (가중 평균)
    composite_score = (
        beta * 0.3 +           # 시장 베타 30%
        smb_score * 0.2 +      # 규모 효과 20%
        hml_score * 0.2 +      # 가치 효과 20%
        rmw_score * 0.15 +     # 수익성 15%
        cma_score * 0.15       # 투자 성향 15%
    )
    
    factors['composite_score'] = composite_score
    
    return factors

def process_single_stock_optimized(symbol, collector, market_data=None):
    """개별 주식 최적화 처리"""
    try:
        print(f"\n{'='*60}")
        print(f"🔍 {symbol} 처리 시작...")
        print(f"{'='*60}")
        
        # 1단계: Chart API로 빠른 주가 데이터 수집
        print(f"📊 {symbol}: 주가 데이터 수집 중...")
        price_data, current_price, currency = collector.get_chart_data_fast(symbol)
        
        if price_data is None or len(price_data) < 30:
            print(f"❌ {symbol}: 충분한 주가 데이터 없음")
            return None
        
        print(f"✅ {symbol}: 주가 데이터 수집 완료 ({len(price_data)}일)")
        
        # 2단계: 필수 펀더멘털 데이터만 수집
        print(f"📈 {symbol}: 펀더멘털 데이터 수집 중...")
        fundamental_info = collector.get_fundamental_data_lite(symbol)
        
        if fundamental_info:
            info_keys = list(fundamental_info.keys())
            print(f"✅ {symbol}: 펀더멘털 데이터 수집 완료 - {len(info_keys)}개 항목")
        else:
            print(f"⚠️ {symbol}: 펀더멘털 데이터 수집 실패 - 기본값으로 계산 진행")
            fundamental_info = {}
        
        # 3단계: 5팩터 모델 계산
        print(f"🧮 {symbol}: 5팩터 모델 계산 중...")
        factors = calculate_5_factor_model_optimized(price_data, market_data, fundamental_info)
        
        if factors is None:
            print(f"❌ {symbol}: 팩터 계산 실패")
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
        
        # 시가총액 USD 변환 추가
        if fundamental_info.get('marketCap') != 'N/A' and fundamental_info.get('marketCap') is not None:
            market_cap_usd = collector.convert_to_usd(fundamental_info['marketCap'], currency)
            result['market_cap_usd'] = market_cap_usd
        
        print(f"🎉 {symbol}: 5팩터 분석 완료!")
        print(f"   📍 종합점수: {factors['composite_score']:.4f}")
        print(f"   💰 현재가: {factors['current_price']:.2f} {currency}")
        print(f"   📊 베타: {factors['beta']:.4f}")
        print(f"   📈 변동성: {factors['volatility']:.4f}")
        if fundamental_info.get('marketCap') != 'N/A' and fundamental_info.get('marketCap') is not None:
            print(f"   🏢 시가총액: {fundamental_info['marketCap']:,.0f} {currency}")
            if 'market_cap_usd' in result:
                print(f"   💵 시가총액(USD): ${result['market_cap_usd']/1e9:.1f}B")
        if fundamental_info.get('priceToBook') != 'N/A' and fundamental_info.get('priceToBook') is not None:
            print(f"   📋 PBR: {fundamental_info['priceToBook']:.4f}")
        
        return result
        
    except Exception as e:
        print(f"❌ {symbol}: 처리 중 오류 - {e}")
        return None

def run_optimized_factor_model():
    """최적화된 5팩터 모델 실행"""
    
    print("🚀 최적화된 일별 5팩터 주식 모델 Ver3 시작!")
    print("=" * 70)
    
    # 데이터 수집기 초기화
    collector = OptimizedStockDataCollector()
    
    # 한국 주식 리스트 (테스트용으로 축소)
    korean_stocks = [
        '005930.KS',  # 삼성전자
        '000660.KS',  # SK하이닉스  
        '035420.KS',  # NAVER
        '005490.KS',  # POSCO홀딩스
        '051910.KS',  # LG화학
        '006400.KS',  # 삼성SDI
        '035720.KS',  # 카카오
        '028260.KS',  # 삼성물산
        '068270.KS',  # 셀트리온
        '096770.KS',  # SK이노베이션
    ]
    
    # 예상 소요 시간 계산 (종목당 약 2.5초 예상)
    estimated_time_per_stock = 2.5  # 초
    total_estimated_time = len(korean_stocks) * estimated_time_per_stock
    estimated_minutes = total_estimated_time / 60
    
    print(f"📊 총 {len(korean_stocks)}개 종목 분석 예정")
    print(f"⏱️ 예상 소요 시간: 약 {estimated_minutes:.1f}분")
    print("=" * 70)
    
    # 시장 지수 데이터 (KOSPI)
    print("🚀 시장 지수 데이터 수집 중...")
    market_data, _, _ = collector.get_chart_data_fast('^KS11')  # KOSPI
    
    if market_data is not None:
        print(f"✅ KOSPI 데이터 수집 완료 ({len(market_data)}일)")
    else:
        print("⚠️ KOSPI 데이터 수집 실패")
    
    # 결과 저장용
    results = []
    failed_stocks = []
    
    print(f"\n📈 {len(korean_stocks)}개 종목 분석 시작...")
    
    # 순차 처리 (안정성 우선)
    for i, symbol in enumerate(korean_stocks, 1):
        print(f"\n🔄 진행률: [{i}/{len(korean_stocks)}] ({i/len(korean_stocks)*100:.1f}%)")
        
        result = process_single_stock_optimized(symbol, collector, market_data)
        
        if result:
            results.append(result)
        else:
            failed_stocks.append(symbol)
        
        # API 부하 방지
        if i < len(korean_stocks):  # 마지막이 아니면 대기
            print(f"⏳ 다음 종목까지 0.5초 대기...")
            time.sleep(0.5)
    
    # 결과 정리 및 출력
    print("\n" + "=" * 70)
    print("🎯 최종 분석 결과 요약")
    print("=" * 70)
    
    print(f"✅ 성공: {len(results)}개 종목")
    print(f"❌ 실패: {len(failed_stocks)}개 종목")
    
    if failed_stocks:
        print(f"❌ 실패 종목: {', '.join(failed_stocks)}")
    
    if results:
        # DataFrame 생성
        df = pd.DataFrame(results)
        
        # 종합 점수 기준 상위 종목
        df_sorted = df.sort_values('composite_score', ascending=False)
        
        print(f"\n🏆 종합 점수 상위 5개 종목:")
        print("-" * 50)
        
        for i, row in df_sorted.head().iterrows():
            print(f"{i+1}위. {row['symbol']}: {row['composite_score']:.4f}")
            print(f"    💰 현재가: {row['current_price']:.2f} {row['currency']}")
            print(f"    📊 베타: {row['beta']:.4f}, 변동성: {row['volatility']:.4f}")
            if row['market_cap'] != 'N/A':
                print(f"    🏢 시가총액: {row['market_cap']:,.0f}")
            if row['pbr'] != 'N/A':
                print(f"    📋 PBR: {row['pbr']:.4f}")
            print()
        
        # CSV 저장
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"factor_analysis_optimized_{timestamp}.csv"
        df_sorted.to_csv(filename, index=False, encoding='utf-8-sig')
        print(f"📁 결과 저장: {filename}")
        
    print(f"\n🎉 최적화된 5팩터 모델 분석 완료!")

if __name__ == "__main__":
    start_time = time.time()
    run_optimized_factor_model()
    end_time = time.time()
    
    print(f"\n⏱️ 총 실행 시간: {end_time - start_time:.1f}초") 