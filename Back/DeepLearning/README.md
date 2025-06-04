# Stock Data Manager & API Server

한국 주식과 미국 주식의 모든 종목명과 종목 코드를 관리하고 검색할 수 있는 파이썬 모듈 및 REST API 서버입니다.

## 📋 목차

- [기능 소개](#기능-소개)
- [설치 방법](#설치-방법)
- [사용 방법](#사용-방법)
- [API 문서](#api-문서)
- [데이터 구조](#데이터-구조)
- [예시 코드](#예시-코드)

## 🚀 기능 소개

### StockDataManager (Python 모듈)
- 한국/미국 주식 데이터 로드 및 관리
- 종목명/종목코드 기반 검색
- 시장별 필터링 (KOSPI, KOSDAQ, NYSE, NASDAQ 등)
- 통계 정보 제공
- JSON/CSV 형태로 데이터 내보내기

### API Server (FastAPI)
- RESTful API를 통한 주식 데이터 조회
- 자동 API 문서 생성 (Swagger UI)
- CORS 지원으로 프론트엔드 연동 가능
- 페이징 지원
- AI 리밸런싱 추천 API (준비 중)

## 📦 설치 방법

### 필요한 패키지 설치

```bash
pip install pandas fastapi uvicorn requests
```

### 데이터 파일 준비

다음 CSV 파일들이 필요합니다:
- `KR_Stock_Master.csv`: 한국 주식 마스터 데이터
- `US_Stock_Master.csv`: 미국 주식 마스터 데이터

## 🎯 사용 방법

### 1. Python 모듈 직접 사용

```python
from stock_data_manager import StockDataManager, StockRegion

# 인스턴스 생성
manager = StockDataManager()

# 통계 확인
stats = manager.get_statistics()
print(f"총 종목 수: {stats['total_stocks']:,}")

# 한국 주식 검색
samsung_stocks = manager.search_stocks("삼성", StockRegion.KOREA, limit=5)
for stock in samsung_stocks:
    print(f"{stock.code} - {stock.name} ({stock.market})")

# 특정 종목 조회
samsung_elec = manager.get_stock_by_code("005930", StockRegion.KOREA)
print(f"삼성전자: {samsung_elec.name} - {samsung_elec.market_cap:,}원")
```

### 2. API 서버 실행

```bash
python server.py
```

서버가 실행되면 다음 주소에서 접근할 수 있습니다:
- API 서버: http://localhost:5001
- API 문서: http://localhost:5001/docs
- API 대안 문서: http://localhost:5001/redoc

### 3. API 클라이언트 사용

```python
import requests

# 삼성 관련 주식 검색
response = requests.get("http://localhost:5001/api/stocks/search", params={
    'query': '삼성',
    'region': '1',  # 1: 한국, 2: 미국
    'limit': 5
})

data = response.json()
if data['success']:
    for stock in data['data']:
        print(f"{stock['code']} - {stock['name']}")
```

## 📚 API 문서

### 주요 엔드포인트

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/` | API 상태 및 통계 확인 |
| GET | `/api/stocks/search` | 주식 검색 |
| GET | `/api/stocks/all` | 전체 주식 목록 |
| GET | `/api/stocks/korean` | 한국 주식 목록 |
| GET | `/api/stocks/us` | 미국 주식 목록 |
| GET | `/api/stocks/market/{market_name}` | 특정 시장 주식 목록 |
| GET | `/api/stocks/info` | 종목 상세 정보 |
| GET | `/api/stocks/statistics` | 통계 정보 |

### 검색 API 사용법

#### 한국 주식 검색
```
GET /api/stocks/search?query=삼성&region=1&limit=10
```

#### 미국 주식 검색
```
GET /api/stocks/search?query=Apple&region=2&limit=10
```

#### 현금 자산 검색
```
GET /api/stocks/search?region=0
```

### 페이징

대부분의 목록 API는 페이징을 지원합니다:
```
GET /api/stocks/korean?offset=0&limit=100
```

## 📊 데이터 구조

### StockInfo 클래스

```python
@dataclass
class StockInfo:
    code: str           # 종목 코드
    name: str           # 종목명
    region: StockRegion # 지역 (0: 현금, 1: 한국, 2: 미국)
    market: str         # 시장 (KOSPI, KOSDAQ, NYSE 등)
    market_cap: float   # 시가총액 (한국 주식만)
    sector: str         # 섹터 (추후 확장)
    industry: str       # 업종 (추후 확장)
```

### API 응답 구조

```json
{
  "success": true,
  "data": [
    {
      "code": "005930",
      "name": "삼성전자",
      "region": 1,
      "market": "KOSPI",
      "marketCap": 336235433969600
    }
  ],
  "total_count": 1,
  "message": null
}
```

## 🔧 예시 코드

### 1. 대량 데이터 처리

```python
from stock_data_manager import StockDataManager

manager = StockDataManager()

# 모든 KOSPI 종목 가져오기
kospi_stocks = manager.get_stocks_by_market("KOSPI")
print(f"KOSPI 종목 수: {len(kospi_stocks)}")

# 시가총액 상위 10개 종목
top_stocks = sorted(
    [s for s in kospi_stocks if s.market_cap],
    key=lambda x: x.market_cap,
    reverse=True
)[:10]

for i, stock in enumerate(top_stocks, 1):
    print(f"{i}. {stock.name}: {stock.market_cap:,}원")
```

### 2. 데이터 내보내기

```python
# JSON으로 내보내기
manager.export_to_json("korean_stocks.json", StockRegion.KOREA)
manager.export_to_json("us_stocks.json", StockRegion.US)

# CSV로 내보내기
manager.export_to_csv("all_stocks.csv")
```

### 3. API 클라이언트 예시

```python
import requests

class StockAPIClient:
    def __init__(self, base_url="http://localhost:5001"):
        self.base_url = base_url
    
    def search_stocks(self, query, region=1, limit=10):
        """주식 검색"""
        response = requests.get(f"{self.base_url}/api/stocks/search", params={
            'query': query,
            'region': str(region),
            'limit': limit
        })
        return response.json()
    
    def get_stock_info(self, code, region=1):
        """종목 상세 정보"""
        response = requests.get(f"{self.base_url}/api/stocks/info", params={
            'code': code,
            'region': str(region)
        })
        return response.json()

# 사용 예시
client = StockAPIClient()
result = client.search_stocks("삼성", region=1, limit=5)
print(result)
```

## 🧪 테스트

전체 기능을 테스트하려면:

```bash
python test_stock_api.py
```

이 스크립트는 다음을 테스트합니다:
- StockDataManager 직접 사용
- API 서버 모든 엔드포인트
- 데이터 내보내기 기능

## 📈 통계 예시

실행 시 다음과 같은 통계를 확인할 수 있습니다:

```
총 종목 수: 5,750
한국 종목 수: 2,881
미국 종목 수: 2,869
KOSPI 종목 수: 945
KOSDAQ 종목 수: 1,936
```

## 🔮 향후 계획

- [ ] AI 리밸런싱 추천 알고리즘 구현
- [ ] 실시간 주가 데이터 연동
- [ ] 섹터/업종 분류 정보 추가
- [ ] 데이터베이스 연동
- [ ] 캐싱 시스템 도입
- [ ] 더 정교한 검색 알고리즘

## 🤝 기여하기

이 프로젝트에 기여하고 싶으시다면:

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다.

## 📞 문의

문제나 제안사항이 있으시면 이슈를 생성해주세요. 