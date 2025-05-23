import axios from 'axios';
import { SPRING_SERVER_URL } from '../constants/config';
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

// 주식 검색 API
export const searchStocks = async (token: string, query: string, region: number) => {
  try {
    const response = await axios.get(
      `${SPRING_SERVER_URL}/stocks/search?query=${encodeURIComponent(query)}&region=${region}`,
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
    console.error('주식 검색 에러:', error);
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