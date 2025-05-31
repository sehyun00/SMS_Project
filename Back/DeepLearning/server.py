from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import uvicorn

app = FastAPI(
    title="Stock Search API",
    description="국내/해외 주식 검색 API",
    version="1.0.0"
)

# CORS 설정 업데이트
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 출처 허용
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메소드 허용
    allow_headers=["*"],  # 모든 헤더 허용
    expose_headers=["*"]  # 모든 헤더 노출
)

# CSV 파일 경로
KR_STOCK_PATH = 'KR_Stock_Master.csv'
US_STOCK_PATH = 'US_Stock_Master.csv'

# Response 모델
class StockInfo(BaseModel):
    name: str
    ticker: str
    region: int
    marketCap: Optional[float] = None

class SearchResponse(BaseModel):
    success: bool
    data: List[StockInfo]
    message: Optional[str] = None

class StockDetailResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    message: Optional[str] = None

# 주식 데이터 로드
def load_stock_data():
    kr_stocks = pd.read_csv(KR_STOCK_PATH)
    us_stocks = pd.read_csv(US_STOCK_PATH)
    return kr_stocks, us_stocks

@app.get("/api/stocks/search", response_model=SearchResponse)
async def search_stocks(
    query: str = Query(default="", description="검색어"),
    region: str = Query(default="0", description="지역 (0: 현금, 1: 국내주식, 2: 해외주식)")
):
    try:
        # 현금 검색인 경우
        if region == "0":
            return SearchResponse(
                success=True,
                data=[
                    StockInfo(name="원화", ticker="KRW", region=0),
                    StockInfo(name="달러", ticker="USD", region=0)
                ]
            )

        # 주식 데이터 로드
        kr_stocks, us_stocks = load_stock_data()

        # 검색 대상 설정
        if region == "1":  # 국내주식
            target_stocks = kr_stocks
        elif region == "2":  # 해외주식
            target_stocks = us_stocks
        else:
            raise HTTPException(status_code=400, detail="잘못된 region 값입니다.")

        # 검색 수행
        if query:
            # 종목명 또는 종목코드로 검색
            if region == "1":  # 국내주식
                filtered = target_stocks[
                    target_stocks['Name'].str.lower().str.contains(query.lower()) |
                    target_stocks['Code'].str.lower().str.contains(query.lower())
                ]
            else:  # 해외주식
                filtered = target_stocks[
                    target_stocks['Company Name'].str.lower().str.contains(query.lower()) |
                    target_stocks['ACT Symbol'].str.lower().str.contains(query.lower())
                ]
        else:
            # 쿼리가 없으면 전체 목록 반환 (최대 30개)
            filtered = target_stocks

        # 결과를 리스트로 변환
        results = []
        for _, row in filtered.head(30).iterrows():
            if region == "1":  # 국내주식
                name = row['Name']
                ticker = row['Code']
                market_cap = float(row['Marcap']) if 'Marcap' in row else None
            else:  # 해외주식
                name = row['Company Name']
                ticker = row['ACT Symbol']
                market_cap = None  # 해외주식은 시가총액 정보가 없음
            
            stock_info = StockInfo(
                name=name,
                ticker=ticker,
                region=1 if region == "1" else 2,
                marketCap=market_cap
            )
            results.append(stock_info)

        return SearchResponse(success=True, data=results)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stocks/info", response_model=StockDetailResponse)
async def get_stock_info(
    ticker: str = Query(..., description="종목코드"),
    region: str = Query(..., description="지역 (1: 국내, 2: 해외)")
):
    try:
        if not ticker or not region:
            raise HTTPException(
                status_code=400,
                detail="종목코드와 지역 정보가 필요합니다."
            )

        # 주식 데이터 로드
        kr_stocks, us_stocks = load_stock_data()

        # 지역에 따른 데이터 선택
        target_stocks = kr_stocks if region == "1" else us_stocks

        # 종목 검색
        stock = target_stocks[target_stocks['Code'] == ticker]

        if len(stock) == 0:
            raise HTTPException(
                status_code=404,
                detail="해당 종목을 찾을 수 없습니다."
            )

        # 종목 정보 반환
        stock_info = stock.iloc[0].to_dict()

        return StockDetailResponse(success=True, data=stock_info)

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=5001, reload=True)
