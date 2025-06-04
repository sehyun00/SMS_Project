"""
일별 5팩터 주식 모델 Ver5 - 종목별 일별 데이터 가공

주요 기능:
1. 종목별 일별 주가 데이터 처리 
2. 기술적 지표 계산 (RSI, MACD, 모멘텀)
3. 5팩터 모델 계산 및 팩터 스코어링
4. 리밸런싱 신호 생성
5. processed_daily_5factor_model.csv 형식으로 출력
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
import logging
from sklearn.preprocessing import StandardScaler
warnings.filterwarnings('ignore')

# TA-Lib 선택적 import (설치되지 않은 경우 대안 사용)
try:
    import talib
    HAS_TALIB = True
    print("✅ TA-Lib 사용 가능")
except ImportError:
    HAS_TALIB = False
    print("⚠️ TA-Lib 미설치 - 대안 라이브러리 확인 중...")

# 대안 라이브러리 확인
try:
    import pandas_ta as ta_pandas
    HAS_PANDAS_TA = True
    print("✅ pandas-ta 사용 가능")
except ImportError:
    HAS_PANDAS_TA = False

try:
    import ta as ta_lib
    HAS_TA = True
    print("✅ ta 라이브러리 사용 가능")
except ImportError:
    HAS_TA = False

if not HAS_TALIB and not HAS_PANDAS_TA and not HAS_TA:
    print("⚠️ 기술적 지표 라이브러리 미설치 - 수동 계산 방법 사용")

class DailyFactorProcessor:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.usd_krw_rate = None
        
        # 폴더 경로 설정
        self.today_str = datetime.now().strftime("%Y%m%d")
        self.preprocessing_dir = "preprocessing"
        self.today_dir = os.path.join(self.preprocessing_dir, self.today_str)
        
        # 섹터/산업 매핑
        self.sector_industry_map = {}
        
        # 통계 추적
        self.stats = {
            'total_processed': 0,
            'successful': 0,
            'failed': 0,
            'start_time': None,
            'errors': []
        }
        
        # 폴더 생성
        self.create_directories()
        
        # 로깅 설정
        self.setup_logging()
        
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
        """USD/KRW 환율 가져오기"""
        if self.usd_krw_rate is not None:
            return self.usd_krw_rate
            
        try:
            print(f"💱 USD/KRW 환율 가져오는 중...")
            
            url = "https://query1.finance.yahoo.com/v8/finance/chart/USDKRW=X"
            params = {'period1': 0, 'period2': 9999999999, 'interval': '1d'}
            
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
    
    def get_stock_data_extended(self, symbol):
        """종목의 확장된 주가 데이터 수집 (2년치)"""
        try:
            end_time = int(time.time())
            start_time = end_time - (2 * 365 * 24 * 60 * 60)  # 2년 전
            
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
                    
                    # 결측치 제거
                    df = df.dropna()
                    df = df.sort_values('Date').reset_index(drop=True)
                    
                    meta = result.get('meta', {})
                    currency = meta.get('currency', 'USD')
                    
                    return df, currency
                    
            return None, None
            
        except Exception as e:
            return None, None
    
    def get_stock_info(self, symbol):
        """종목 정보 수집 (이름, 섹터, 산업, 기본 펀더멘털)"""
        try:
            url = f"https://finance.yahoo.com/quote/{symbol}/"
            response = self.session.get(url, timeout=8)
            
            if response.status_code != 200:
                return None
            
            html_content = response.text
            info = {}
            
            # 회사명 찾기
            name_patterns = [
                r'"shortName":"([^"]+)"',
                r'"longName":"([^"]+)"',
                r'<h1[^>]*>([^<]+)</h1>'
            ]
            
            for pattern in name_patterns:
                matches = re.findall(pattern, html_content)
                if matches:
                    info['name'] = matches[0]
                    break
            
            if 'name' not in info:
                info['name'] = symbol
            
            # 섹터 찾기
            sector_patterns = [
                r'"sector":"([^"]+)"',
                r'Sector.*?">([^<]+)</span>',
            ]
            
            for pattern in sector_patterns:
                matches = re.findall(pattern, html_content)
                if matches:
                    info['sector'] = matches[0]
                    break
            
            if 'sector' not in info:
                if symbol.endswith('.KS'):
                    info['sector'] = 'Unknown'
                else:
                    info['sector'] = 'Unknown'
            
            # 산업 찾기
            industry_patterns = [
                r'"industry":"([^"]+)"',
                r'Industry.*?">([^<]+)</span>',
            ]
            
            for pattern in industry_patterns:
                matches = re.findall(pattern, html_content)
                if matches:
                    info['industry'] = matches[0]
                    break
            
            if 'industry' not in info:
                info['industry'] = 'Unknown'
            
            # 베타값 찾기
            beta_patterns = [
                r'"beta":\s*\{\s*"raw":\s*([0-9.]+)',
                r'"beta":\s*([0-9.]+)',
            ]
            
            for pattern in beta_patterns:
                matches = re.findall(pattern, html_content)
                if matches:
                    try:
                        beta_value = float(matches[0])
                        if 0.1 < beta_value < 5.0:
                            info['beta'] = beta_value
                            break
                    except ValueError:
                        continue
            
            if 'beta' not in info:
                info['beta'] = 1.0
            
            # PBR 찾기
            pbr_patterns = [
                r'"priceToBook":\s*\{\s*"raw":\s*([0-9.]+)',
                r'"priceToBook":\s*([0-9.]+)',
            ]
            
            for pattern in pbr_patterns:
                matches = re.findall(pattern, html_content)
                if matches:
                    try:
                        pbr_value = float(matches[0])
                        if 0.1 < pbr_value < 50:
                            info['pbr'] = pbr_value
                            break
                    except ValueError:
                        continue
            
            if 'pbr' not in info:
                info['pbr'] = 1.0
            
            # 시가총액 찾기
            cap_patterns = [
                r'Market Cap[^>]*>\s*([0-9,.]+[KMBT])\s*<',
                r'"marketCap":\s*\{\s*"raw":\s*([0-9.]+)',
            ]
            
            for pattern in cap_patterns:
                matches = re.findall(pattern, html_content)
                if matches:
                    try:
                        if 'KMBT' in matches[0]:
                            cap_value = self.parse_market_cap_text(matches[0])
                        else:
                            cap_value = float(matches[0])
                        
                        if cap_value and cap_value > 1000000:
                            info['market_cap'] = cap_value
                            break
                    except ValueError:
                        continue
            
            if 'market_cap' not in info:
                info['market_cap'] = 1000000000  # 기본값 10억
            
            return info
            
        except Exception as e:
            return {'name': symbol, 'sector': 'Unknown', 'industry': 'Unknown', 
                   'beta': 1.0, 'pbr': 1.0, 'market_cap': 1000000000}
    
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
    
    def calculate_technical_indicators(self, df):
        """기술적 지표 계산"""
        if len(df) < 50:
            return df
        
        try:
            # 모멘텀 계산
            df['Momentum1M'] = df['Close'].pct_change(periods=21) * 100  # 1개월
            df['Momentum3M'] = df['Close'].pct_change(periods=63) * 100  # 3개월  
            df['Momentum6M'] = df['Close'].pct_change(periods=126) * 100  # 6개월
            df['Momentum12M'] = df['Close'].pct_change(periods=252) * 100  # 12개월
            
            # 변동성 계산
            df['Volatility'] = df['Close'].pct_change().rolling(window=252).std() * np.sqrt(252) * 100
            
            # RSI 계산 (여러 라이브러리 지원)
            df['RSI'] = self.calculate_rsi_with_fallback(df['Close'])
            
            # MACD 계산 (여러 라이브러리 지원)
            macd_data = self.calculate_macd_with_fallback(df['Close'])
            df['MACD'] = macd_data['MACD']
            df['Signal'] = macd_data['Signal']
            df['MACD_Hist'] = macd_data['MACD_Hist']
            
            return df
            
        except Exception as e:
            print(f"❌ 기술적 지표 계산 실패: {e}")
            return df
    
    def calculate_rsi_with_fallback(self, prices, period=14):
        """RSI 계산 (여러 라이브러리 지원)"""
        try:
            # 1순위: TA-Lib
            if HAS_TALIB:
                try:
                    return pd.Series(talib.RSI(prices.values, timeperiod=period), index=prices.index)
                except:
                    pass
            
            # 2순위: pandas-ta
            if HAS_PANDAS_TA:
                try:
                    return ta_pandas.rsi(prices, length=period)
                except:
                    pass
            
            # 3순위: ta 라이브러리
            if HAS_TA:
                try:
                    return ta_lib.momentum.RSIIndicator(prices, window=period).rsi()
                except:
                    pass
            
            # 4순위: 수동 계산
            return self.calculate_rsi_manual(prices, period)
            
        except Exception as e:
            print(f"❌ RSI 계산 실패: {e}")
            return pd.Series([50] * len(prices), index=prices.index)
    
    def calculate_macd_with_fallback(self, prices, fast=12, slow=26, signal=9):
        """MACD 계산 (여러 라이브러리 지원)"""
        try:
            # 1순위: TA-Lib
            if HAS_TALIB:
                try:
                    macd, signal_line, hist = talib.MACD(prices.values, 
                                                        fastperiod=fast, 
                                                        slowperiod=slow, 
                                                        signalperiod=signal)
                    return {
                        'MACD': pd.Series(macd, index=prices.index),
                        'Signal': pd.Series(signal_line, index=prices.index),
                        'MACD_Hist': pd.Series(hist, index=prices.index)
                    }
                except:
                    pass
            
            # 2순위: pandas-ta
            if HAS_PANDAS_TA:
                try:
                    macd_result = ta_pandas.macd(prices, fast=fast, slow=slow, signal=signal)
                    return {
                        'MACD': macd_result[f'MACD_{fast}_{slow}_{signal}'],
                        'Signal': macd_result[f'MACDs_{fast}_{slow}_{signal}'],
                        'MACD_Hist': macd_result[f'MACDh_{fast}_{slow}_{signal}']
                    }
                except:
                    pass
            
            # 3순위: ta 라이브러리
            if HAS_TA:
                try:
                    macd_indicator = ta_lib.trend.MACD(prices, 
                                                      window_fast=fast, 
                                                      window_slow=slow, 
                                                      window_sign=signal)
                    return {
                        'MACD': macd_indicator.macd(),
                        'Signal': macd_indicator.macd_signal(),
                        'MACD_Hist': macd_indicator.macd_diff()
                    }
                except:
                    pass
            
            # 4순위: 수동 계산
            return self.calculate_macd_manual(prices, fast, slow, signal)
            
        except Exception as e:
            print(f"❌ MACD 계산 실패: {e}")
            return {
                'MACD': pd.Series([0] * len(prices), index=prices.index),
                'Signal': pd.Series([0] * len(prices), index=prices.index),
                'MACD_Hist': pd.Series([0] * len(prices), index=prices.index)
            }
    
    def calculate_rsi_manual(self, prices, period=14):
        """수동 RSI 계산 (TA-Lib 대안)"""
        try:
            delta = prices.diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs))
            return rsi
        except:
            return pd.Series([50] * len(prices), index=prices.index)
    
    def calculate_macd_manual(self, prices, fast=12, slow=26, signal=9):
        """수동 MACD 계산 (TA-Lib 대안)"""
        try:
            exp1 = prices.ewm(span=fast, adjust=False).mean()
            exp2 = prices.ewm(span=slow, adjust=False).mean()
            macd = exp1 - exp2
            signal_line = macd.ewm(span=signal, adjust=False).mean()
            macd_hist = macd - signal_line
            
            return {
                'MACD': macd,
                'Signal': signal_line,
                'MACD_Hist': macd_hist
            }
        except:
            return {
                'MACD': pd.Series([0] * len(prices), index=prices.index),
                'Signal': pd.Series([0] * len(prices), index=prices.index),
                'MACD_Hist': pd.Series([0] * len(prices), index=prices.index)
            }
    
    def calculate_factor_scores(self, df, stock_info, currency):
        """5팩터 스코어 계산"""
        try:
            # 시가총액 USD 변환
            market_cap_usd = stock_info['market_cap']
            if currency == 'KRW':
                usd_krw_rate = self.get_usd_krw_rate()
                market_cap_usd = stock_info['market_cap'] / usd_krw_rate
            
            # 각 팩터 스코어 계산 (-1 ~ 1)
            
            # 1. Beta Factor
            beta = stock_info['beta']
            if beta < 0.8:
                beta_factor = -0.5
            elif beta > 1.2:
                beta_factor = -1.0
            else:
                beta_factor = (1.0 - beta) * 0.5
            
            # 2. Value Factor (PBR 기반)
            pbr = stock_info['pbr']
            if pbr < 1.0:
                value_factor = 1.0
            elif pbr > 3.0:
                value_factor = -1.0
            else:
                value_factor = (3.0 - pbr) / 2.0 - 1.0
            
            # 3. Size Factor
            if market_cap_usd < 300e6:  # 300M 미만 - 소형주
                size_factor = 1.0
            elif market_cap_usd > 10e9:  # 10B 초과 - 대형주
                size_factor = -1.0
            else:
                size_factor = 0.0
            
            # 4. Momentum Factor (최근 30일 기준)
            recent_data = df.tail(30)
            if len(recent_data) > 0 and 'Momentum1M' in recent_data.columns:
                momentum_1m = recent_data['Momentum1M'].iloc[-1]
                if pd.notna(momentum_1m):
                    if momentum_1m > 10:
                        momentum_factor = 1.0
                    elif momentum_1m < -10:
                        momentum_factor = -1.0
                    else:
                        momentum_factor = momentum_1m / 10.0
                else:
                    momentum_factor = 0.0
            else:
                momentum_factor = 0.0
            
            # 5. Volatility Factor (최근 데이터 기준)
            if len(recent_data) > 0 and 'Volatility' in recent_data.columns:
                volatility = recent_data['Volatility'].iloc[-1]
                if pd.notna(volatility):
                    if volatility < 20:
                        volatility_factor = 1.0
                    elif volatility > 50:
                        volatility_factor = -1.0
                    else:
                        volatility_factor = (50 - volatility) / 30.0 - 1.0
                else:
                    volatility_factor = 0.0
            else:
                volatility_factor = 0.0
            
            return {
                'Beta_Factor': beta_factor,
                'Value_Factor': value_factor, 
                'Size_Factor': size_factor,
                'Momentum_Factor': momentum_factor,
                'Volatility_Factor': volatility_factor
            }
            
        except Exception as e:
            print(f"❌ 팩터 스코어 계산 실패: {e}")
            return {
                'Beta_Factor': 0.0,
                'Value_Factor': 0.0,
                'Size_Factor': 0.0, 
                'Momentum_Factor': 0.0,
                'Volatility_Factor': 0.0
            }
    
    def calculate_signals(self, factor_scores):
        """리밸런싱 신호 계산"""
        try:
            # 가중 스코어 계산
            weights = {
                'Beta_Factor': 0.2,
                'Value_Factor': 0.25,
                'Size_Factor': 0.2,
                'Momentum_Factor': 0.2,
                'Volatility_Factor': 0.15
            }
            
            weighted_score = sum(factor_scores[factor] * weights[factor] 
                                for factor in weights.keys())
            
            # 백분위 계산 (임시로 정규화)
            factor_percentile = (weighted_score + 1) / 2  # -1~1을 0~1로 변환
            
            # 신호 생성
            if weighted_score > 0.3:
                smart_signal = "BUY"
                signal_strength = "STRONG" if weighted_score > 0.6 else "MEDIUM"
                rebalance_priority = 1.0 + (1 - weighted_score) * 2  # 1-3
                to_rebalance = 1
            elif weighted_score < -0.3:
                smart_signal = "SELL"
                signal_strength = "STRONG" if weighted_score < -0.6 else "MEDIUM"
                rebalance_priority = 10.0 + abs(weighted_score) * 3  # 10-13
                to_rebalance = 1
            else:
                smart_signal = "NEUTRAL"
                signal_strength = "MEDIUM"
                rebalance_priority = 5.0 + abs(weighted_score) * 5  # 5-10
                to_rebalance = 0
            
            return {
                'weighted_score': weighted_score,
                'factor_percentile': factor_percentile,
                'smart_signal': smart_signal,
                'signal_strength': signal_strength,
                'rebalance_priority': rebalance_priority,
                'to_rebalance': to_rebalance
            }
            
        except Exception as e:
            print(f"❌ 신호 계산 실패: {e}")
            return {
                'weighted_score': 0.0,
                'factor_percentile': 0.5,
                'smart_signal': "NEUTRAL",
                'signal_strength': "MEDIUM", 
                'rebalance_priority': 5.0,
                'to_rebalance': 0
            }
    
    def process_single_stock(self, symbol):
        """개별 종목 처리"""
        try:
            self.stats['total_processed'] += 1
            
            # 주가 데이터 수집
            df, currency = self.get_stock_data_extended(symbol)
            if df is None or len(df) < 100:
                error_msg = "데이터 부족"
                self.log_error(symbol, error_msg)
                self.stats['failed'] += 1
                return []
            
            # 종목 정보 수집
            stock_info = self.get_stock_info(symbol)
            if stock_info is None:
                error_msg = "종목 정보 없음"
                self.log_error(symbol, error_msg)
                self.stats['failed'] += 1
                return []
            
            # 기술적 지표 계산
            df = self.calculate_technical_indicators(df)
            
            # 팩터 스코어 계산
            factor_scores = self.calculate_factor_scores(df, stock_info, currency)
            
            # 신호 계산
            signals = self.calculate_signals(factor_scores)
            
            # 최근 30일 데이터만 결과로 반환
            recent_df = df.tail(30).copy()
            
            results = []
            for _, row in recent_df.iterrows():
                if pd.isna(row['Date']):
                    continue
                
                result = {
                    'Symbol': symbol,
                    'Name': stock_info['name'],
                    'Date': row['Date'].strftime('%Y-%m-%d'),
                    'Beta': stock_info['beta'],
                    'PBR': stock_info['pbr'],
                    'MarketCap': stock_info['market_cap'] / 1e9,  # 억 단위
                    'Momentum1M': row.get('Momentum1M', 0),
                    'Momentum3M': row.get('Momentum3M', 0),
                    'Momentum6M': row.get('Momentum6M', 0),
                    'Momentum12M': row.get('Momentum12M', 0),
                    'Volatility': row.get('Volatility', 0),
                    'RSI': row.get('RSI', 50),
                    'MACD': row.get('MACD', 0),
                    'Signal': row.get('Signal', 0),
                    'MACD_Hist': row.get('MACD_Hist', 0),
                    'Sector': stock_info['sector'],
                    'Industry': stock_info['industry'],
                    'Beta_Factor': factor_scores['Beta_Factor'],
                    'Value_Factor': factor_scores['Value_Factor'],
                    'Size_Factor': factor_scores['Size_Factor'],
                    'Momentum_Factor': factor_scores['Momentum_Factor'],
                    'Volatility_Factor': factor_scores['Volatility_Factor'],
                    'weighted_score': signals['weighted_score'],
                    'factor_percentile': signals['factor_percentile'],
                    'smart_signal': signals['smart_signal'],
                    'signal_strength': signals['signal_strength'],
                    'rebalance_priority': signals['rebalance_priority'],
                    'to_rebalance': signals['to_rebalance']
                }
                
                results.append(result)
            
            self.stats['successful'] += 1
            return results
            
        except Exception as e:
            error_msg = f"처리 실패: {str(e)}"
            self.log_error(symbol, error_msg)
            self.stats['failed'] += 1
            return []

    def setup_logging(self):
        """로깅 설정"""
        try:
            # 로그 파일명
            log_filename = f"daily_factor_model_ver5_{self.today_str}.log"
            log_filepath = os.path.join(self.today_dir, log_filename)
            
            # 로거 설정
            self.logger = logging.getLogger('DailyFactorProcessor')
            self.logger.setLevel(logging.INFO)
            
            # 기존 핸들러 제거
            for handler in self.logger.handlers[:]:
                self.logger.removeHandler(handler)
            
            # 파일 핸들러
            file_handler = logging.FileHandler(log_filepath, encoding='utf-8')
            file_handler.setLevel(logging.INFO)
            
            # 콘솔 핸들러
            console_handler = logging.StreamHandler()
            console_handler.setLevel(logging.INFO)
            
            # 포맷터
            formatter = logging.Formatter(
                '%(asctime)s | %(levelname)s | %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            
            file_handler.setFormatter(formatter)
            console_handler.setFormatter(formatter)
            
            self.logger.addHandler(file_handler)
            self.logger.addHandler(console_handler)
            
            self.logger.info(f"🚀 일별 5팩터 모델 Ver5 로깅 시작")
            self.logger.info(f"📁 로그 파일: {log_filepath}")
            
        except Exception as e:
            print(f"❌ 로깅 설정 실패: {e}")
            # 기본 로거 사용
            self.logger = logging.getLogger('DailyFactorProcessor')
            
    def log_progress(self, current, total, symbol, status, details=""):
        """진행 상황 로그"""
        progress_pct = (current / total) * 100
        elapsed_time = time.time() - self.stats['start_time'] if self.stats['start_time'] else 0
        
        if elapsed_time > 0:
            rate = current / elapsed_time
            eta = (total - current) / rate if rate > 0 else 0
            eta_str = f"ETA: {eta/3600:.1f}h" if eta > 3600 else f"ETA: {eta/60:.1f}m"
        else:
            eta_str = "ETA: 계산중"
        
        message = f"[{current:4d}/{total}] {progress_pct:5.1f}% | {symbol:12s} | {status:8s} | {eta_str}"
        if details:
            message += f" | {details}"
            
        self.logger.info(message)
        
    def log_batch_summary(self, batch_num, processed_count):
        """배치 요약 로그"""
        elapsed = time.time() - self.stats['start_time'] if self.stats['start_time'] else 0
        success_rate = (self.stats['successful'] / self.stats['total_processed'] * 100) if self.stats['total_processed'] > 0 else 0
        
        self.logger.info(f"📊 배치 {batch_num} 완료 | 성공률: {success_rate:.1f}% | 경과시간: {elapsed/60:.1f}분")
        
    def log_error(self, symbol, error_msg):
        """에러 로그"""
        self.stats['errors'].append({'symbol': symbol, 'error': error_msg, 'time': datetime.now()})
        self.logger.error(f"❌ {symbol}: {error_msg}")
        
    def log_final_summary(self, total_symbols, total_records):
        """최종 요약 로그"""
        elapsed = time.time() - self.stats['start_time'] if self.stats['start_time'] else 0
        success_rate = (self.stats['successful'] / self.stats['total_processed'] * 100) if self.stats['total_processed'] > 0 else 0
        
        self.logger.info("=" * 80)
        self.logger.info(f"🎉 처리 완료!")
        self.logger.info(f"📊 총 종목: {total_symbols:,}개")
        self.logger.info(f"✅ 성공: {self.stats['successful']:,}개 ({success_rate:.1f}%)")
        self.logger.info(f"❌ 실패: {self.stats['failed']:,}개")
        self.logger.info(f"📈 총 레코드: {total_records:,}개")
        self.logger.info(f"⏱️ 총 시간: {elapsed/3600:.1f}시간")
        
        if self.stats['errors']:
            self.logger.info(f"📋 주요 에러 ({len(self.stats['errors'])}개):")
            for i, error in enumerate(self.stats['errors'][:5]):  # 최대 5개만 표시
                self.logger.info(f"   {i+1}. {error['symbol']}: {error['error']}")
                
        self.logger.info("=" * 80)

def load_stock_symbols():
    """주식 심볼 로드"""
    try:
        # 한국 주식 (전체)
        kr_stocks = pd.read_csv('../data/KR_Stock_Master.csv')
        kr_symbols = [f"{code}.KS" for code in kr_stocks['Code'].astype(str)]
        
        # 미국 주식 (전체)
        us_stocks = pd.read_csv('../data/US_Stock_Master.csv')
        us_symbols = us_stocks['ACT Symbol'].tolist()
        
        print(f"📊 한국 주식: {len(kr_symbols):,}개 (전체)")
        print(f"📊 미국 주식: {len(us_symbols):,}개 (전체)")
        print(f"📊 총 처리 대상: {len(kr_symbols) + len(us_symbols):,}개 종목")
        print(f"📊 예상 레코드: {(len(kr_symbols) + len(us_symbols)) * 30:,}개")
        print(f"⏱️ 예상 시간: {(len(kr_symbols) + len(us_symbols)) * 0.8 / 3600:.1f}시간")
        
        return kr_symbols + us_symbols
        
    except Exception as e:
        print(f"❌ 주식 심볼 로드 실패: {e}")
        return []

def run_daily_factor_processing():
    """일별 팩터 처리 실행"""
    
    print("🚀 일별 5팩터 주식 모델 Ver5 - 전체 종목 일별 데이터 처리 시작!")
    print("=" * 80)
    
    # 심볼 로드
    symbols = load_stock_symbols()
    
    if not symbols:
        print("❌ 처리할 종목이 없습니다.")
        return
    
    # 프로세서 초기화
    processor = DailyFactorProcessor()
    processor.stats['start_time'] = time.time()
    
    processor.logger.info(f"📊 총 처리 대상: {len(symbols):,}개 종목")
    processor.logger.info(f"🎯 예상 레코드: {len(symbols) * 30:,}개")
    processor.logger.info(f"⏱️ 예상 시간: {len(symbols) * 0.8 / 3600:.1f}시간")
    processor.logger.info("=" * 60)
    
    # 전체 결과 저장
    all_results = []
    processed_count = 0
    batch_size = 50  # 배치 크기
    
    # 각 종목 처리
    for i, symbol in enumerate(symbols, 1):
        results = processor.process_single_stock(symbol)
        if results:
            all_results.extend(results)
            processed_count += 1
            status = "성공"
            details = f"{len(results)}일"
        else:
            status = "실패"
            details = ""
        
        # 진행 상황 로그 (매 종목마다)
        processor.log_progress(i, len(symbols), symbol, status, details)
        
        # API 부하 방지
        time.sleep(0.2)
        
        # 배치 단위 중간 저장
        if i % batch_size == 0 or i == len(symbols):
            save_batch_results(all_results, processor.today_dir, i, processor.logger)
            processor.log_batch_summary(i, processed_count)
    
    # 최종 통합 결과 저장
    if all_results:
        save_final_results(all_results, processor.preprocessing_dir, processor.logger)
        processor.log_final_summary(len(symbols), len(all_results))
    else:
        processor.logger.error("❌ 처리된 데이터가 없습니다.")

def save_batch_results(results, today_dir, batch_num, logger):
    """배치 단위 중간 저장"""
    try:
        if not results:
            return
            
        # 컬럼 순서 정의
        columns = [
            'Symbol', 'Name', 'Date', 'Beta', 'PBR', 'MarketCap',
            'Momentum1M', 'Momentum3M', 'Momentum6M', 'Momentum12M',
            'Volatility', 'RSI', 'MACD', 'Signal', 'MACD_Hist',
            'Sector', 'Industry', 'Beta_Factor', 'Value_Factor', 'Size_Factor',
            'Momentum_Factor', 'Volatility_Factor', 'weighted_score', 
            'factor_percentile', 'smart_signal', 'signal_strength',
            'rebalance_priority', 'to_rebalance'
        ]
        
        # DataFrame 생성
        df = pd.DataFrame(results)
        df = df[columns]
        
        # 날짜순 정렬
        df = df.sort_values(['Symbol', 'Date']).reset_index(drop=True)
        
        # 배치 파일 저장
        batch_filename = f'batch_{batch_num:04d}.csv'
        batch_path = os.path.join(today_dir, batch_filename)
        df.to_csv(batch_path, index=False, encoding='utf-8-sig')
        
        logger.info(f"💾 배치 저장: {batch_filename} ({len(df):,}개 레코드)")
        
    except Exception as e:
        logger.error(f"❌ 배치 저장 실패: {e}")

def save_final_results(all_results, preprocessing_dir, logger):
    """최종 결과 저장"""
    try:
        # 컬럼 순서 정의
        columns = [
            'Symbol', 'Name', 'Date', 'Beta', 'PBR', 'MarketCap',
            'Momentum1M', 'Momentum3M', 'Momentum6M', 'Momentum12M',
            'Volatility', 'RSI', 'MACD', 'Signal', 'MACD_Hist',
            'Sector', 'Industry', 'Beta_Factor', 'Value_Factor', 'Size_Factor',
            'Momentum_Factor', 'Volatility_Factor', 'weighted_score', 
            'factor_percentile', 'smart_signal', 'signal_strength',
            'rebalance_priority', 'to_rebalance'
        ]
        
        # DataFrame 생성
        df = pd.DataFrame(all_results)
        df = df[columns]  # 컬럼 순서 맞춤
        
        # 날짜순 정렬
        df = df.sort_values(['Symbol', 'Date']).reset_index(drop=True)
        
        # 저장
        output_path = os.path.join(preprocessing_dir, 'processed_daily_5factor_model_ver5.csv')
        df.to_csv(output_path, index=False, encoding='utf-8-sig')
        
        logger.info(f"\n💾 결과 저장 완료:")
        logger.info(f"   파일: {output_path}")
        logger.info(f"   레코드: {len(df):,}개")
        logger.info(f"   종목수: {df['Symbol'].nunique():,}개")
        logger.info(f"   기간: {df['Date'].min()} ~ {df['Date'].max()}")
        
        # 요약 통계
        buy_signals = len(df[df['smart_signal'] == 'BUY'])
        sell_signals = len(df[df['smart_signal'] == 'SELL'])
        neutral_signals = len(df[df['smart_signal'] == 'NEUTRAL'])
        
        logger.info(f"\n📊 신호 분포:")
        logger.info(f"   BUY: {buy_signals:,}개 ({buy_signals/len(df)*100:.1f}%)")
        logger.info(f"   SELL: {sell_signals:,}개 ({sell_signals/len(df)*100:.1f}%)")
        logger.info(f"   NEUTRAL: {neutral_signals:,}개 ({neutral_signals/len(df)*100:.1f}%)")
        
    except Exception as e:
        logger.error(f"❌ 결과 저장 실패: {e}")

if __name__ == "__main__":
    start_time = time.time()
    print(f"🕐 시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    run_daily_factor_processing()
    
    end_time = time.time()
    elapsed_time = end_time - start_time
    
    print(f"\n⏱️ 종료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"⏱️ 총 실행 시간: {elapsed_time/3600:.2f}시간 ({elapsed_time/60:.1f}분)")
    print(f"📊 평균 처리 속도: {elapsed_time:.1f}초/종목" if elapsed_time > 0 else "") 