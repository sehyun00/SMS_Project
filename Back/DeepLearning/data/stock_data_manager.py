"""
Stock Data Manager - 한국 및 미국 주식 데이터 관리 모듈
"""

import pandas as pd
import json
from typing import List, Dict, Optional, Union
from dataclasses import dataclass
from enum import Enum
import logging

# 로그 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StockRegion(Enum):
    """주식 지역 분류"""
    CASH = 0      # 현금
    KOREA = 1     # 한국 주식
    US = 2        # 미국 주식

@dataclass
class StockInfo:
    """주식 정보 데이터 클래스"""
    code: str           # 종목 코드
    name: str           # 종목명
    region: StockRegion # 지역
    market: Optional[str] = None      # 시장 (KOSPI, KOSDAQ, NYSE, NASDAQ 등)
    market_cap: Optional[float] = None # 시가총액
    sector: Optional[str] = None       # 섹터
    industry: Optional[str] = None     # 업종

class StockDataManager:
    """주식 데이터 관리자 클래스"""
    
    def __init__(self, kr_stock_path: str = 'KR_Stock_Master.csv', 
                 us_stock_path: str = 'US_Stock_Master.csv'):
        """
        초기화
        
        Args:
            kr_stock_path: 한국 주식 데이터 파일 경로
            us_stock_path: 미국 주식 데이터 파일 경로
        """
        self.kr_stock_path = kr_stock_path
        self.us_stock_path = us_stock_path
        self.kr_stocks_df = None
        self.us_stocks_df = None
        self.kr_stocks_list = []
        self.us_stocks_list = []
        
        # 데이터 로드
        self.load_all_data()
    
    def load_all_data(self) -> None:
        """모든 주식 데이터를 로드합니다."""
        try:
            self.load_korean_stocks()
            self.load_us_stocks()
            logger.info("모든 주식 데이터 로드 완료")
        except Exception as e:
            logger.error(f"데이터 로드 중 오류 발생: {e}")
            raise
    
    def load_korean_stocks(self) -> None:
        """한국 주식 데이터를 로드합니다."""
        try:
            self.kr_stocks_df = pd.read_csv(self.kr_stock_path)
            logger.info(f"한국 주식 데이터 로드 완료: {len(self.kr_stocks_df)} 종목")
            
            # StockInfo 객체 리스트로 변환
            self.kr_stocks_list = []
            for _, row in self.kr_stocks_df.iterrows():
                stock_info = StockInfo(
                    code=str(row['Code']),
                    name=str(row['Name']),
                    region=StockRegion.KOREA,
                    market=str(row.get('Market', '')),
                    market_cap=float(row['Marcap']) if pd.notna(row.get('Marcap')) else None
                )
                self.kr_stocks_list.append(stock_info)
                
        except Exception as e:
            logger.error(f"한국 주식 데이터 로드 실패: {e}")
            raise
    
    def load_us_stocks(self) -> None:
        """미국 주식 데이터를 로드합니다."""
        try:
            self.us_stocks_df = pd.read_csv(self.us_stock_path)
            logger.info(f"미국 주식 데이터 로드 완료: {len(self.us_stocks_df)} 종목")
            
            # StockInfo 객체 리스트로 변환
            self.us_stocks_list = []
            for _, row in self.us_stocks_df.iterrows():
                stock_info = StockInfo(
                    code=str(row['ACT Symbol']),
                    name=str(row['Company Name']),
                    region=StockRegion.US,
                    market=self._determine_us_market(str(row['ACT Symbol']))
                )
                self.us_stocks_list.append(stock_info)
                
        except Exception as e:
            logger.error(f"미국 주식 데이터 로드 실패: {e}")
            raise
    
    def _determine_us_market(self, symbol: str) -> str:
        """미국 주식의 시장을 결정합니다 (단순화된 버전)"""
        # 실제로는 더 정교한 로직이 필요하지만, 기본적으로 NYSE로 설정
        # 나중에 별도의 시장 정보 데이터를 추가할 수 있습니다
        return "NYSE"
    
    def get_all_korean_stocks(self) -> List[StockInfo]:
        """모든 한국 주식 정보를 반환합니다."""
        return self.kr_stocks_list.copy()
    
    def get_all_us_stocks(self) -> List[StockInfo]:
        """모든 미국 주식 정보를 반환합니다."""
        return self.us_stocks_list.copy()
    
    def get_all_stocks(self) -> List[StockInfo]:
        """모든 주식 정보를 반환합니다."""
        return self.kr_stocks_list + self.us_stocks_list
    
    def search_stocks(self, query: str, region: Optional[StockRegion] = None, 
                     limit: int = 50) -> List[StockInfo]:
        """
        주식을 검색합니다.
        
        Args:
            query: 검색어 (종목명 또는 종목코드)
            region: 검색할 지역 (None이면 전체)
            limit: 반환할 최대 결과 수
            
        Returns:
            검색 결과 리스트
        """
        query = query.lower().strip()
        results = []
        
        # 검색 대상 결정
        if region is None:
            search_stocks = self.kr_stocks_list + self.us_stocks_list
        elif region == StockRegion.KOREA:
            search_stocks = self.kr_stocks_list
        elif region == StockRegion.US:
            search_stocks = self.us_stocks_list
        else:
            return []
        
        # 검색 수행
        for stock in search_stocks:
            if (query in stock.name.lower() or 
                query in stock.code.lower()):
                results.append(stock)
                
                if len(results) >= limit:
                    break
        
        return results
    
    def get_stock_by_code(self, code: str, region: StockRegion) -> Optional[StockInfo]:
        """
        종목코드로 특정 주식 정보를 가져옵니다.
        
        Args:
            code: 종목 코드
            region: 지역
            
        Returns:
            주식 정보 또는 None
        """
        search_stocks = (self.kr_stocks_list if region == StockRegion.KOREA 
                        else self.us_stocks_list)
        
        for stock in search_stocks:
            if stock.code == code:
                return stock
        
        return None
    
    def get_stocks_by_market(self, market: str) -> List[StockInfo]:
        """
        특정 시장의 주식들을 가져옵니다.
        
        Args:
            market: 시장명 (KOSPI, KOSDAQ, NYSE, NASDAQ 등)
            
        Returns:
            해당 시장의 주식 리스트
        """
        results = []
        all_stocks = self.kr_stocks_list + self.us_stocks_list
        
        for stock in all_stocks:
            if stock.market and market.upper() in stock.market.upper():
                results.append(stock)
        
        return results
    
    def get_statistics(self) -> Dict[str, int]:
        """주식 데이터 통계를 반환합니다."""
        kr_kospi = len([s for s in self.kr_stocks_list if s.market == 'KOSPI'])
        kr_kosdaq = len([s for s in self.kr_stocks_list if s.market and 'KOSDAQ' in s.market])
        
        return {
            'total_stocks': len(self.kr_stocks_list) + len(self.us_stocks_list),
            'korean_stocks': len(self.kr_stocks_list),
            'us_stocks': len(self.us_stocks_list),
            'kospi_stocks': kr_kospi,
            'kosdaq_stocks': kr_kosdaq
        }
    
    def export_to_json(self, filename: str, region: Optional[StockRegion] = None) -> None:
        """
        주식 데이터를 JSON 파일로 내보냅니다.
        
        Args:
            filename: 저장할 파일명
            region: 내보낼 지역 (None이면 전체)
        """
        if region is None:
            stocks = self.kr_stocks_list + self.us_stocks_list
        elif region == StockRegion.KOREA:
            stocks = self.kr_stocks_list
        elif region == StockRegion.US:
            stocks = self.us_stocks_list
        else:
            stocks = []
        
        # StockInfo 객체를 딕셔너리로 변환
        stocks_dict = []
        for stock in stocks:
            stock_dict = {
                'code': stock.code,
                'name': stock.name,
                'region': stock.region.value,
                'region_name': stock.region.name,
                'market': stock.market,
                'market_cap': stock.market_cap
            }
            stocks_dict.append(stock_dict)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(stocks_dict, f, ensure_ascii=False, indent=2)
        
        logger.info(f"데이터 내보내기 완료: {filename} ({len(stocks_dict)} 종목)")
    
    def export_to_csv(self, filename: str, region: Optional[StockRegion] = None) -> None:
        """
        주식 데이터를 CSV 파일로 내보냅니다.
        
        Args:
            filename: 저장할 파일명
            region: 내보낼 지역 (None이면 전체)
        """
        if region is None:
            stocks = self.kr_stocks_list + self.us_stocks_list
        elif region == StockRegion.KOREA:
            stocks = self.kr_stocks_list
        elif region == StockRegion.US:
            stocks = self.us_stocks_list
        else:
            stocks = []
        
        # DataFrame으로 변환
        data = []
        for stock in stocks:
            data.append({
                'code': stock.code,
                'name': stock.name,
                'region': stock.region.value,
                'region_name': stock.region.name,
                'market': stock.market,
                'market_cap': stock.market_cap
            })
        
        df = pd.DataFrame(data)
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        
        logger.info(f"데이터 내보내기 완료: {filename} ({len(stocks)} 종목)")

# 편의 함수들
def get_korean_stocks() -> List[StockInfo]:
    """한국 주식 정보를 간단히 가져오는 함수"""
    manager = StockDataManager()
    return manager.get_all_korean_stocks()

def get_us_stocks() -> List[StockInfo]:
    """미국 주식 정보를 간단히 가져오는 함수"""
    manager = StockDataManager()
    return manager.get_all_us_stocks()

def search_stock(query: str, region: Optional[StockRegion] = None) -> List[StockInfo]:
    """주식 검색을 간단히 수행하는 함수"""
    manager = StockDataManager()
    return manager.search_stocks(query, region)

# 사용 예시
if __name__ == "__main__":
    # StockDataManager 인스턴스 생성
    stock_manager = StockDataManager()
    
    # 통계 정보 출력
    stats = stock_manager.get_statistics()
    print("=== 주식 데이터 통계 ===")
    for key, value in stats.items():
        print(f"{key}: {value:,}")
    
    # 한국 주식 검색 예시
    print("\n=== 삼성 관련 한국 주식 검색 ===")
    samsung_stocks = stock_manager.search_stocks("삼성", StockRegion.KOREA, limit=5)
    for stock in samsung_stocks:
        print(f"{stock.code} - {stock.name} ({stock.market})")
    
    # 미국 주식 검색 예시
    print("\n=== Apple 관련 미국 주식 검색 ===")
    apple_stocks = stock_manager.search_stocks("Apple", StockRegion.US, limit=5)
    for stock in apple_stocks:
        print(f"{stock.code} - {stock.name}")
    
    # 특정 종목 조회 예시
    print("\n=== 특정 종목 조회 ===")
    samsung_elec = stock_manager.get_stock_by_code("005930", StockRegion.KOREA)
    if samsung_elec:
        print(f"종목: {samsung_elec.name} ({samsung_elec.code})")
        print(f"시장: {samsung_elec.market}")
        print(f"시가총액: {samsung_elec.market_cap:,}원" if samsung_elec.market_cap else "시가총액: N/A")
    
    # KOSPI 종목들 조회 예시
    print("\n=== KOSPI 종목 수 ===")
    kospi_stocks = stock_manager.get_stocks_by_market("KOSPI")
    print(f"KOSPI 종목 수: {len(kospi_stocks)}")
    
    # 데이터 내보내기 예시
    print("\n=== 데이터 내보내기 ===")
    stock_manager.export_to_json("all_stocks.json")
    stock_manager.export_to_json("korean_stocks.json", StockRegion.KOREA)
    stock_manager.export_to_json("us_stocks.json", StockRegion.US)
    
    stock_manager.export_to_csv("all_stocks.csv")
    stock_manager.export_to_csv("korean_stocks.csv", StockRegion.KOREA)
    stock_manager.export_to_csv("us_stocks.csv", StockRegion.US) 