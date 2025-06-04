from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import uvicorn
import shutil
from stock_data_manager import StockDataManager, StockInfo, StockRegion

app = FastAPI(
    title="Stock Search API",
    description="국내/해외 주식 검색 API - Enhanced with StockDataManager",
    version="2.0.0"
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

# StockDataManager 인스턴스 생성 (data 디렉토리의 파일 사용)
stock_manager = StockDataManager(
    kr_stock_path='data/KR_Stock_Master.csv',
    us_stock_path='data/US_Stock_Master.csv'
)

# Response 모델들
class StockApiResponse(BaseModel):
    code: str
    name: str
    region: int
    market: Optional[str] = None
    marketCap: Optional[float] = None

class SearchResponse(BaseModel):
    success: bool
    data: List[StockApiResponse]
    message: Optional[str] = None
    total_count: Optional[int] = None

class StockDetailResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    message: Optional[str] = None

class StockListResponse(BaseModel):
    success: bool
    data: List[StockApiResponse]
    message: Optional[str] = None
    total_count: int

class StatisticsResponse(BaseModel):
    success: bool
    data: dict
    message: Optional[str] = None

# 내부 함수: StockInfo를 API 응답 형태로 변환
def convert_stock_info_to_api_response(stock_info: StockInfo) -> StockApiResponse:
    """StockInfo 객체를 API 응답 형태로 변환"""
    return StockApiResponse(
        code=stock_info.code,
        name=stock_info.name,
        region=stock_info.region.value,
        market=stock_info.market,
        marketCap=stock_info.market_cap
    )

@app.get("/", summary="API 상태 확인")
async def root():
    """API 루트 엔드포인트"""
    stats = stock_manager.get_statistics()
    return {
        "message": "Stock Search API v2.0.0",
        "status": "running",
        "data_loaded": True,
        "statistics": stats
    }

@app.get("/api/stocks/search", response_model=SearchResponse, summary="주식 검색")
async def search_stocks(
    query: str = Query(default="", description="검색어 (종목명 또는 종목코드)"),
    region: str = Query(default="0", description="지역 (0: 현금, 1: 국내주식, 2: 해외주식)"),
    limit: int = Query(default=30, description="결과 제한 수", ge=1, le=100)
):
    """
    주식을 검색합니다.
    
    - **query**: 검색어 (종목명 또는 종목코드)
    - **region**: 지역 (0: 현금, 1: 국내주식, 2: 해외주식)
    - **limit**: 반환할 최대 결과 수 (1-100)
    """
    try:
        # 현금 검색인 경우
        if region == "0":
            cash_items = [
                StockApiResponse(code="KRW", name="원화", region=0, market="CASH"),
                StockApiResponse(code="USD", name="달러", region=0, market="CASH")
            ]
            return SearchResponse(
                success=True,
                data=cash_items,
                total_count=len(cash_items)
            )

        # 지역 설정
        stock_region = None
        if region == "1":
            stock_region = StockRegion.KOREA
        elif region == "2":
            stock_region = StockRegion.US
        else:
            raise HTTPException(status_code=400, detail="잘못된 region 값입니다.")

        # 검색 수행
        search_results = stock_manager.search_stocks(query, stock_region, limit)
        
        # API 응답 형태로 변환
        api_results = [convert_stock_info_to_api_response(stock) for stock in search_results]

        return SearchResponse(
            success=True, 
            data=api_results,
            total_count=len(api_results)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stocks/all", response_model=StockListResponse, summary="전체 주식 목록")
async def get_all_stocks(
    region: Optional[str] = Query(default=None, description="지역 (1: 국내, 2: 해외, null: 전체)"),
    offset: int = Query(default=0, description="페이지 오프셋", ge=0),
    limit: int = Query(default=100, description="페이지 크기", ge=1, le=1000)
):
    """
    전체 주식 목록을 가져옵니다.
    
    - **region**: 지역 필터 (1: 국내, 2: 해외, null: 전체)
    - **offset**: 페이지 오프셋
    - **limit**: 페이지 크기
    """
    try:
        # 지역별 주식 목록 가져오기
        if region == "1":
            stocks = stock_manager.get_all_korean_stocks()
        elif region == "2":
            stocks = stock_manager.get_all_us_stocks()
        elif region is None:
            stocks = stock_manager.get_all_stocks()
        else:
            raise HTTPException(status_code=400, detail="잘못된 region 값입니다.")
        
        # 페이징 적용
        total_count = len(stocks)
        paged_stocks = stocks[offset:offset + limit]
        
        # API 응답 형태로 변환
        api_results = [convert_stock_info_to_api_response(stock) for stock in paged_stocks]
        
        return StockListResponse(
            success=True,
            data=api_results,
            total_count=total_count
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stocks/korean", response_model=StockListResponse, summary="한국 주식 목록")
async def get_korean_stocks(
    offset: int = Query(default=0, description="페이지 오프셋", ge=0),
    limit: int = Query(default=100, description="페이지 크기", ge=1, le=1000)
):
    """한국 주식 목록을 가져옵니다."""
    try:
        stocks = stock_manager.get_all_korean_stocks()
        total_count = len(stocks)
        paged_stocks = stocks[offset:offset + limit]
        
        api_results = [convert_stock_info_to_api_response(stock) for stock in paged_stocks]
        
        return StockListResponse(
            success=True,
            data=api_results,
            total_count=total_count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stocks/us", response_model=StockListResponse, summary="미국 주식 목록")
async def get_us_stocks(
    offset: int = Query(default=0, description="페이지 오프셋", ge=0),
    limit: int = Query(default=100, description="페이지 크기", ge=1, le=1000)
):
    """미국 주식 목록을 가져옵니다."""
    try:
        stocks = stock_manager.get_all_us_stocks()
        total_count = len(stocks)
        paged_stocks = stocks[offset:offset + limit]
        
        api_results = [convert_stock_info_to_api_response(stock) for stock in paged_stocks]
        
        return StockListResponse(
            success=True,
            data=api_results,
            total_count=total_count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stocks/market/{market_name}", response_model=StockListResponse, summary="특정 시장 주식 목록")
async def get_stocks_by_market(
    market_name: str,
    offset: int = Query(default=0, description="페이지 오프셋", ge=0),
    limit: int = Query(default=100, description="페이지 크기", ge=1, le=1000)
):
    """
    특정 시장의 주식 목록을 가져옵니다.
    
    - **market_name**: 시장명 (KOSPI, KOSDAQ, NYSE, NASDAQ 등)
    """
    try:
        stocks = stock_manager.get_stocks_by_market(market_name)
        total_count = len(stocks)
        paged_stocks = stocks[offset:offset + limit]
        
        api_results = [convert_stock_info_to_api_response(stock) for stock in paged_stocks]
        
        return StockListResponse(
            success=True,
            data=api_results,
            total_count=total_count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stocks/info", response_model=StockDetailResponse, summary="종목 상세 정보")
async def get_stock_info(
    code: str = Query(..., description="종목코드"),
    region: str = Query(..., description="지역 (1: 국내, 2: 해외)")
):
    """
    특정 종목의 상세 정보를 가져옵니다.
    
    - **code**: 종목코드
    - **region**: 지역 (1: 국내, 2: 해외)
    """
    try:
        if not code or not region:
            raise HTTPException(
                status_code=400,
                detail="종목코드와 지역 정보가 필요합니다."
            )

        # 지역 설정
        stock_region = StockRegion.KOREA if region == "1" else StockRegion.US

        # 종목 검색
        stock = stock_manager.get_stock_by_code(code, stock_region)

        if not stock:
            raise HTTPException(
                status_code=404,
                detail="해당 종목을 찾을 수 없습니다."
            )

        # 종목 정보 반환
        stock_info = {
            "code": stock.code,
            "name": stock.name,
            "region": stock.region.value,
            "region_name": stock.region.name,
            "market": stock.market,
            "market_cap": stock.market_cap,
            "sector": stock.sector,
            "industry": stock.industry
        }

        return StockDetailResponse(success=True, data=stock_info)

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stocks/statistics", response_model=StatisticsResponse, summary="주식 데이터 통계")
async def get_statistics():
    """주식 데이터 통계 정보를 가져옵니다."""
    try:
        stats = stock_manager.get_statistics()
        return StatisticsResponse(
            success=True,
            data=stats
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# AI 리밸런싱 추천 API (추후 구현 예정)
@app.post("/ai/rebalancing-recommendation", summary="AI 리밸런싱 추천 (준비 중)")
async def ai_rebalancing_recommendation(portfolio_data: dict):
    """
    AI 리밸런싱 추천 API (현재 준비 중)
    
    향후 머신러닝 모델과 연동하여 포트폴리오 최적화 추천을 제공할 예정입니다.
    """
    # 임시 응답
    return {
        "success": False,
        "message": "AI 리밸런싱 추천 기능은 현재 개발 중입니다.",
        "recommendations": [],
        "reasoning": "아직 구현되지 않았습니다."
    }

# Daily 5-Factor Model API 추가
@app.post("/api/factor-model/run", summary="일별 5팩터 모델 실행")
async def run_daily_factor_model():
    """
    일별 5팩터 모델을 실행하여 주식 분석 및 리밸런싱 신호를 생성합니다.
    
    이 API는 다음 작업을 수행합니다:
    - 한국/미국 주식 데이터 수집
    - 5팩터 (Beta, Value, Size, Momentum, Volatility) 분석
    - 매수/매도 신호 생성
    - 리밸런싱 우선순위 계산
    """
    try:
        from daily_factor_model import DailyStockFactorModel
        
        # 모델 실행
        model = DailyStockFactorModel()
        result_data = model.run_pipeline()
        
        if result_data is not None and len(result_data) > 0:
            # 결과 요약 계산
            total_stocks = result_data['Symbol'].nunique()
            total_days = result_data['Date'].nunique()
            total_rows = len(result_data)
            buy_signals = len(result_data[result_data['smart_signal'] == 'BUY'])
            sell_signals = len(result_data[result_data['smart_signal'] == 'SELL'])
            
            return {
                "success": True,
                "message": "5팩터 모델 실행 완료",
                "summary": {
                    "total_stocks": total_stocks,
                    "total_trading_days": total_days,
                    "total_data_points": total_rows,
                    "buy_signals": buy_signals,
                    "sell_signals": sell_signals,
                    "neutral_signals": total_rows - buy_signals - sell_signals
                },
                "data_preview": result_data.head(10).to_dict('records')
            }
        else:
            return {
                "success": False,
                "message": "5팩터 모델 실행 중 데이터 생성 실패",
                "error": "결과 데이터가 비어있습니다."
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"5팩터 모델 실행 중 오류 발생: {str(e)}"
        )

@app.get("/api/factor-model/latest", summary="최신 팩터 모델 결과 조회")
async def get_latest_factor_model_results(
    limit: int = Query(default=100, description="결과 제한 수", ge=1, le=1000)
):
    """
    가장 최근에 생성된 팩터 모델 결과를 조회합니다.
    """
    try:
        import glob
        import pandas as pd
        from pathlib import Path
        
        # CSV 파일 찾기
        csv_files = glob.glob("processed_daily_5factor_model_*.csv")
        
        if not csv_files:
            raise HTTPException(
                status_code=404,
                detail="팩터 모델 결과 파일을 찾을 수 없습니다. /api/factor-model/run을 먼저 실행하세요."
            )
        
        # 가장 최신 파일 선택
        latest_file = max(csv_files)
        
        # 데이터 로드
        df = pd.read_csv(latest_file)
        
        # 최신 날짜 데이터만 필터링
        latest_date = df['Date'].max()
        latest_data = df[df['Date'] == latest_date].head(limit)
        
        return {
            "success": True,
            "data": latest_data.to_dict('records'),
            "metadata": {
                "file_name": latest_file,
                "latest_date": latest_date,
                "total_stocks": len(latest_data),
                "data_summary": {
                    "buy_signals": len(latest_data[latest_data['smart_signal'] == 'BUY']),
                    "sell_signals": len(latest_data[latest_data['smart_signal'] == 'SELL']),
                    "neutral_signals": len(latest_data[latest_data['smart_signal'] == 'NEUTRAL'])
                }
            }
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"팩터 모델 결과 조회 중 오류 발생: {str(e)}"
        )

if __name__ == "__main__":
    import os
    from pathlib import Path
    
    print("=== Stock Search API Server ===")
    print("데이터 파일 확인 중...")
    
    # data 디렉토리 생성
    data_dir = Path('data')
    data_dir.mkdir(exist_ok=True)
    
    # data 디렉토리 파일 경로
    kr_file = data_dir / 'KR_Stock_Master.csv'
    us_file = data_dir / 'US_Stock_Master.csv'
    
    # 기존 루트 디렉토리 파일 경로
    old_kr_file = Path('KR_Stock_Master.csv')
    old_us_file = Path('US_Stock_Master.csv')
    
    # 기존 파일이 루트에 있고 data에 없으면 이동
    if old_kr_file.exists() and not kr_file.exists():
        shutil.move(str(old_kr_file), str(kr_file))
        print(f"📦 {old_kr_file} → {kr_file} 이동 완료")
    
    if old_us_file.exists() and not us_file.exists():
        shutil.move(str(old_us_file), str(us_file))
        print(f"📦 {old_us_file} → {us_file} 이동 완료")
    
    # data 디렉토리 파일 존재 확인
    if not kr_file.exists() or not us_file.exists():
        print("❌ 필요한 데이터 파일이 없습니다!")
        print(f"   - {kr_file}: {'✅ 존재' if kr_file.exists() else '❌ 없음'}")
        print(f"   - {us_file}: {'✅ 존재' if us_file.exists() else '❌ 없음'}")
        print("\n📋 해결 방법:")
        print("1. 다음 명령어로 실시간 주식 데이터를 수집하세요:")
        print("   python stock_data_fetcher.py")
        print("2. 또는 기존 CSV 파일을 data/ 디렉토리에 복사하세요.")
        print("\n⚠️  서버를 시작할 수 없습니다.")
        exit(1)
    
    print("✅ 데이터 파일 확인 완료")
    print(f"   - 한국 주식: {kr_file}")
    print(f"   - 미국 주식: {us_file}")
    print("StockDataManager 초기화 중...")
    
    try:
        # 서버 시작 전 데이터 로드 상태 확인
        stats = stock_manager.get_statistics()
        print(f"데이터 로드 완료: {stats}")
        
        print("🚀 서버 시작...")
        print("📖 API 문서: http://localhost:5001/docs")
        uvicorn.run("server:app", host="0.0.0.0", port=5001, reload=True)
        
    except Exception as e:
        print(f"❌ 서버 시작 실패: {e}")
        print("\n📋 해결 방법:")
        print("1. 데이터 파일이 올바른지 확인하세요:")
        print("   - data/KR_Stock_Master.csv")
        print("   - data/US_Stock_Master.csv")
        print("2. 새로운 데이터를 수집하려면:")
        print("   python stock_data_fetcher.py")
        exit(1)
