import { NLP_SERVER_URL } from '../constants/config';

// 포트폴리오 분석 요청 인터페이스
export interface PortfolioAnalysisRequest {
  portfolio_stocks: string[];
  raw_weights: number[];
}

// 포트폴리오 분석 응답 인터페이스
export interface PortfolioAnalysisResponse {
  portfolio_score: string;
  portfolio_rank: string;
  high_priority: string[];
  medium_priority: string[];
}

// ESG 포트폴리오 분석 API 호출
export const analyzePortfolio = async (
  portfolioData: PortfolioAnalysisRequest
): Promise<{
  success: boolean;
  data?: PortfolioAnalysisResponse;
  error?: string;
}> => {
  try {
    console.log('[NLP API] 포트폴리오 분석 요청:', {
      url: `${NLP_SERVER_URL}/analyze`,
      portfolioStocksCount: portfolioData.portfolio_stocks.length,
      rawWeightsCount: portfolioData.raw_weights.length,
      portfolioStocks: portfolioData.portfolio_stocks,
      rawWeights: portfolioData.raw_weights
    });

    const response = await fetch(`${NLP_SERVER_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(portfolioData),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('[NLP API] 분석 실패:', {
        status: response.status,
        statusText: response.statusText,
        result
      });
      
      return {
        success: false,
        error: result.detail || `서버 오류: ${response.status}`
      };
    }

    // rank를 100점 만점으로 변환
    const transformedResult = {
      ...result,
      portfolio_rank: (parseFloat(result.portfolio_rank) * 100).toFixed(1)
    };

    console.log('[NLP API] 분석 성공:', {
      score: transformedResult.portfolio_score,
      rank: transformedResult.portfolio_rank,
      highPriorityCount: transformedResult.high_priority.length,
      mediumPriorityCount: transformedResult.medium_priority.length
    });

    return {
      success: true,
      data: transformedResult
    };

  } catch (error) {
    console.error('[NLP API] 네트워크 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
}; 