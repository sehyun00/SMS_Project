"""
환율 변환 기능 테스트
KRW를 USD로 변환하여 통화 통일
"""

import requests

def get_usd_krw_rate():
    """USD/KRW 환율 가져오기 (Yahoo Finance 활용)"""
    try:
        # Yahoo Finance Chart API로 USD/KRW 환율
        url = "https://query1.finance.yahoo.com/v8/finance/chart/USDKRW=X"
        params = {
            'period1': 0,
            'period2': 9999999999,
            'interval': '1d'
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if 'chart' in data and 'result' in data['chart'] and data['chart']['result']:
                result = data['chart']['result'][0]
                meta = result.get('meta', {})
                current_rate = meta.get('regularMarketPrice')
                
                if current_rate:
                    print(f"✅ USD/KRW 환율: {current_rate:.2f}")
                    return current_rate
        
        # 실패시 기본값 (대략적인 환율)
        print(f"⚠️ 환율 API 실패 - 기본값 1300 사용")
        return 1300
        
    except Exception as e:
        print(f"❌ 환율 가져오기 실패: {e}")
        return 1300

def convert_krw_to_usd(krw_amount, usd_krw_rate):
    """KRW를 USD로 변환"""
    return krw_amount / usd_krw_rate

def test_currency_conversion():
    """환율 변환 테스트"""
    print("💱 환율 변환 테스트")
    
    # 환율 가져오기
    usd_krw_rate = get_usd_krw_rate()
    
    # 테스트 데이터 (실제 Ver3 결과)
    test_data = [
        {'symbol': '005930.KS', 'name': '삼성전자', 'market_cap': 379983000000000, 'currency': 'KRW'},
        {'symbol': '000660.KS', 'name': 'SK하이닉스', 'market_cap': 150840000000000, 'currency': 'KRW'},
        {'symbol': 'AAPL', 'name': '애플', 'market_cap': 3036000000000, 'currency': 'USD'},
    ]
    
    print(f"\n📊 시가총액 비교 (USD 통일):")
    print("-" * 60)
    
    for item in test_data:
        symbol = item['symbol']
        name = item['name']
        market_cap = item['market_cap']
        currency = item['currency']
        
        if currency == 'KRW':
            # KRW를 USD로 변환
            market_cap_usd = convert_krw_to_usd(market_cap, usd_krw_rate)
            print(f"{name} ({symbol}):")
            print(f"   원화: {market_cap/1e12:.1f}조원")
            print(f"   달러: ${market_cap_usd/1e9:.1f}B")
        else:
            # 이미 USD
            print(f"{name} ({symbol}):")
            print(f"   달러: ${market_cap/1e9:.1f}B")
        print()

if __name__ == "__main__":
    test_currency_conversion() 