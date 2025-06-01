import axios from 'axios';
import { SPRING_SERVER_URL, FLASK_SERVER_URL, FASTAPI_SERVER_URL } from '../constants/config';
import { Platform } from 'react-native';
import { Account, Record, Rud } from '../data/dummyData';

// 포트폴리오 인터페이스
export interface Portfolio {
  portfolio_id?: number;
  portfolio_name: string;
  assets: PortfolioItem[];
  created_at?: string;
  updated_at?: string;
  description?: string;
}

// 포트폴리오 항목 인터페이스
export interface PortfolioItem {
  name: string;          // 종목명 또는 현금 항목명
  ticker?: string;       // 주식 티커 (현금인 경우 없음)
  region: 0 | 1 | 2;     // 0: 현금, 1: 국내주식, 2: 해외주식
  target_percent: number; // 목표 비중
  current_amount?: number; // 현재 보유 금액
  current_qty?: number;  // 보유 수량
  currency?: 'KRW' | 'USD'; // 통화 (KRW: 원화, USD: 달러)
}

// 포트폴리오 목록 가져오기
export const fetchPortfolios = async (token: string) => {
  try {
    const response = await axios.get(
      `${SPRING_SERVER_URL}/portfolios`,
      {
        headers: {
          'Accept': 'application/json',
          'Platform': Platform.OS,
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('포트폴리오 목록 불러오기 에러:', error);
    return {
      success: false,
      error: error
    };
  }
};

// 포트폴리오 상세 정보 가져오기
export const fetchPortfolioDetails = async (token: string, portfolioId: number) => {
  try {
    const response = await axios.get(
      `${SPRING_SERVER_URL}/portfolios/${portfolioId}`,
      {
        headers: {
          'Accept': 'application/json',
          'Platform': Platform.OS,
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('포트폴리오 상세 정보 불러오기 에러:', error);
    return {
      success: false,
      error: error
    };
  }
};

// 새 포트폴리오 생성
export const createPortfolio = async (token: string, portfolio: Portfolio) => {
  try {
    const response = await axios.post(
      `${SPRING_SERVER_URL}/portfolios`,
      portfolio,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Platform': Platform.OS,
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('포트폴리오 생성 에러:', error);
    return {
      success: false,
      error: error
    };
  }
};

// 포트폴리오 수정
export const updatePortfolio = async (token: string, portfolioId: number, portfolio: Portfolio) => {
  try {
    const response = await axios.put(
      `${SPRING_SERVER_URL}/portfolios/${portfolioId}`,
      portfolio,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Platform': Platform.OS,
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('포트폴리오 수정 에러:', error);
    return {
      success: false,
      error: error
    };
  }
};

// 포트폴리오 삭제
export const deletePortfolio = async (token: string, portfolioId: number) => {
  try {
    const response = await axios.delete(
      `${SPRING_SERVER_URL}/portfolios/${portfolioId}`,
      {
        headers: {
          'Accept': 'application/json',
          'Platform': Platform.OS,
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('포트폴리오 삭제 에러:', error);
    return {
      success: false,
      error: error
    };
  }
};

// 주식 검색 함수
export const searchStocks = async (token: string, query: string, region: number) => {
  try {
    const response = await axios.get(
      `${FASTAPI_SERVER_URL}/api/stocks/search`,
      {
        params: {
          query,
          region: region.toString()
        },
        headers: {
          'Accept': 'application/json',
          'Platform': Platform.OS,
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('Search API Response:', response.data);

    return {
      success: true,
      data: response.data.data || response.data
    };
  } catch (error) {
    console.error('주식 검색 에러:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error Response:', error.response.data);
    }
    return {
      success: false,
      error: error
    };
  }
};

// 리밸런싱 결과 저장
export const saveRebalancingResult = async (token: string, accountId: string, recordData: Record, items: Rud[]) => {
  try {
    const payload = {
      record: recordData,
      items: items
    };
    
    const response = await axios.post(
      `${SPRING_SERVER_URL}/rebalancing/save`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Platform': Platform.OS,
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('리밸런싱 결과 저장 에러:', error);
    return {
      success: false,
      error: error
    };
  }
};

// 리밸런싱 레코드 저장
export const saveRebalancingRecord = async (token: string, recordData: {
  account: string;
  totalBalance: number;
  recordName: string;
  memo: string;
  profitRate: number;
}) => {
  try {
    const response = await axios.post(
      `${SPRING_SERVER_URL}/mystockaccount/record/save`,
      recordData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Platform': Platform.OS,
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('리밸런싱 레코드 저장 에러:', error);
    return {
      success: false,
      error: error
    };
  }
};

// 리밸런싱 종목 정보 저장
export const saveRebalancingStocks = async (
  token: string,
  accountNumber: string,
  recordId: number,
  stocks: Array<{
    stock_name: string;
    expert_per: number;
    market_order: number;
    rate: number;
    nos: number;
    won: number;
    dollar: number;
    rebalancing_dollar: number;
    market_type: string;
    stock_region: number;
  }>
) => {
  try {
    const response = await axios.post(
      `${SPRING_SERVER_URL}/mystockaccount/record/account?account=${accountNumber}`,
      {
        record_id: recordId,
        stocks: stocks
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Platform': Platform.OS,
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('리밸런싱 종목 정보 저장 에러:', error);
    return {
      success: false,
      error: error
    };
  }
}; 