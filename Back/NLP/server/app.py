import sys
import os
from pathlib import Path

# 현재 디렉토리를 Python 경로에 추가
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import uvicorn
from datetime import datetime

# nlp_project.py 안전한 임포트
try:
    from nlp_project import WebScrapingStockAnalysisSystem
    print("✅ nlp_project.py 임포트 성공")
except ImportError as e:
    print(f"❌ nlp_project.py 임포트 실패: {e}")
    print(f"📁 현재 경로: {current_dir}")
    print("💡 nlp_project.py 파일이 app.py와 같은 폴더에 있는지 확인하세요")
    sys.exit(1)

app = FastAPI(
    title="ESG Portfolio Analysis API",
    description="웹 크롤링 기반 ESG 포트폴리오 분석 서비스",
    version="1.0.0"
)

# Request/Response 모델 정의
class PortfolioRequest(BaseModel):
    portfolio_stocks: List[str]
    raw_weights: List[int]

class PortfolioResponse(BaseModel):
    portfolio_score: str
    portfolio_rank: str
    high_priority: List[str]
    medium_priority: List[str]

# 분석 시스템 싱글톤
class AnalysisSystem:
    _instance = None
    _analyzer = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def get_analyzer(self):
        if self._analyzer is None:
            self._analyzer = WebScrapingStockAnalysisSystem(risk_profile='중립')
        return self._analyzer

# 전역 분석 시스템 인스턴스
analysis_system = AnalysisSystem()

# extract_portfolio_response 함수
def extract_portfolio_response(analysis_result) -> Dict[str, Any]:
    """분석 결과에서 API 응답 형태로 변환 - 실제 nlp_project 결과 활용"""
    try:
        # 종합 등급 정보 추출
        grading_result = analysis_result.get('grading_result', {})
        grade = grading_result.get('grade', 'C')
        comprehensive_score = grading_result.get('comprehensive_score', 0.5)
        
        # 등급 설명 매핑
        grade_description = {
            'A+': '최우수', 'A': '우수', 'A-': '양호',
            'B+': '보통', 'B': '보통', 'B-': '보통',
            'C+': '개선필요', 'C': '개선필요', 'C-': '개선필요',
            'D': '부족', 'F': '매우부족'
        }.get(grade, '보통')
        
        # 포트폴리오 점수와 등급 (실제 결과 활용)
        portfolio_score = grade
        portfolio_rank = f"{comprehensive_score:.2f}"
        
        # 실제 투자 제안 정보 추출
        recommendations = analysis_result.get('investment_recommendations', [])
        
        high_priority = []
        medium_priority = []
        
        # nlp_project의 실제 투자 제안 결과 활용
        for rec in recommendations:
            priority = rec.get('priority', 'low')
            category = rec.get('category', '')
            action = rec.get('action', '')
            amount = rec.get('amount', 0)
            
            # 이모지 선택
            if priority == 'high':
                emoji = "🔥" if amount >= 0.15 else "⚠️"
            elif priority == 'medium':
                emoji = "💡" if amount >= 0.10 else "📊"
            else:
                emoji = "📈"
            
            recommendation_text = f"{emoji} {category} 비중을 {amount*100:.1f}% {action} 합니다"
            
            if priority == 'high':
                high_priority.append(recommendation_text)
            elif priority == 'medium':
                medium_priority.append(recommendation_text)
        
        # 기본값 설정 (추천사항이 없는 경우)
        if not high_priority and not medium_priority:
            # ESG 분석 결과 확인
            portfolio_analysis = analysis_result.get('portfolio_analysis', {})
            esg_analysis = portfolio_analysis.get('esg_analysis', {})
            esg_ratio = esg_analysis.get('esg_ratio', 0)
            
            if esg_ratio < 0.3:
                high_priority = ["🌱 ESG 투자 비중을 30% 이상으로 늘리는 것을 권장합니다"]
            else:
                high_priority = ["✅ 현재 포트폴리오가 적절한 분포를 유지하고 있습니다"]
        
        return {
            'portfolio_score': portfolio_score,
            'portfolio_rank': portfolio_rank,
            'high_priority': high_priority,
            'medium_priority': medium_priority
        }
        
    except Exception as e:
        print(f"❌ 응답 데이터 추출 중 오류: {e}")
        # 에러 발생 시 기본 응답
        return {
            'portfolio_score': "C",
            'portfolio_rank': "0.50",
            'high_priority': ["⚠️ 분석 중 오류가 발생했습니다. 다시 시도해주세요"],
            'medium_priority': []
        }

# API 엔드포인트들
@app.get("/")
async def root():
    return {
        "message": "ESG Portfolio Analysis API",
        "status": "running",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/analyze", response_model=PortfolioResponse)
async def analyze_portfolio(request: PortfolioRequest):
    try:
        # 입력 데이터 검증
        if not request.portfolio_stocks:
            raise HTTPException(status_code=400, detail="portfolio_stocks는 비어있을 수 없습니다")
        
        if len(request.portfolio_stocks) != len(request.raw_weights):
            raise HTTPException(status_code=400, detail="portfolio_stocks와 raw_weights의 길이가 일치해야 합니다")
        
        # 가중치 정규화
        total_weight = sum(request.raw_weights)
        if total_weight <= 0:
            raise HTTPException(status_code=400, detail="가중치의 합은 0보다 커야 합니다")
        
        normalized_weights = [w / total_weight for w in request.raw_weights]
        
        print(f"📊 포트폴리오 분석 시작: {len(request.portfolio_stocks)}개 종목")
        
        # 실제 분석 시스템 실행
        analyzer = analysis_system.get_analyzer()
        analysis_result = analyzer.analyze_portfolio(request.portfolio_stocks, normalized_weights)
        
        # 실제 분석 결과에서 응답 데이터 추출
        response_data = extract_portfolio_response(analysis_result)
        
        print(f"✅ 분석 완료")
        
        return PortfolioResponse(**response_data)
        
    except Exception as e:
        print(f"❌ 분석 중 오류 발생: {str(e)}")
        raise HTTPException(status_code=500, detail=f"포트폴리오 분석 중 오류가 발생했습니다: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    print("🚀 ESG Portfolio Analysis Server 시작")
    print(f"📁 작업 디렉토리: {os.getcwd()}")
    print("📊 API 문서: http://localhost:8000/docs")
    
    try:
        uvicorn.run(
            "app:app",
            host="0.0.0.0",  # localhost → 0.0.0.0으로 변경
            port=8000,
            reload=False,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 서버가 정상적으로 종료되었습니다")
    except Exception as e:
        print(f"❌ 서버 실행 오류: {e}")
        sys.exit(1)
