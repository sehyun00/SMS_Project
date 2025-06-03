import axios from 'axios';
import { SPRING_SERVER_URL, FLASK_SERVER_URL, FASTAPI_SERVER_URL } from '../constants/config';
import { Platform } from 'react-native';
import { Account, Record, Rud, getAccountRecords, getRecordRuds } from '../data/dummyData';

// 리밸런싱 기록 응답 인터페이스
export interface GetRebalancingResponse {
  record_id: number;
  account: string;
  user_id: string;
  record_date: string;
  total_balance: number;
  record_name: string;
  memo: string;
  profit_rate: number;
}

// 리밸런싱 상세 정보 응답 인터페이스
export interface GetRebalancingStockResponse {
  record_id: number;
  stock_name: string;
  expert_per: number;
  market_order: number;
  rate: number;
  nos: number;
  won: number;
  dollar: number;
  rebalancing_dollar: number;
  stock_region: number;
  market_type_name: string;
}

// API 응답 타입 정의
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: unknown;
  isDummy?: boolean;
}

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
    console.log('Token:', token);
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Platform': Platform.OS,
      'Authorization': `Bearer ${token}`
    });

    const response = await axios.post(
      `${SPRING_SERVER_URL}/mystockaccount/record/detail/save`,
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
    if (axios.isAxiosError(error)) {
      console.error('API 에러 상태 코드:', error.response?.status);
      console.error('API 에러 응답:', error.response?.data);
    }
    return {
      success: false,
      error: error
    };
  }
};

// 더미 데이터를 API 응답 타입으로 변환하는 함수
function convertDummyToApiResponse(records: Record[]): GetRebalancingResponse[] {
  return records.map(record => ({
    record_id: record.record_id,
    account: record.account,
    user_id: record.user_id,
    record_date: record.record_date,
    total_balance: record.total_balance,
    record_name: record.record_name,
    memo: record.memo,
    profit_rate: record.profit_rate
  }));
}

function convertDummyToApiStockResponse(ruds: Rud[]): GetRebalancingStockResponse[] {
  return ruds.map(rud => ({
    record_id: rud.record_id,
    stock_name: rud.stock_name,
    expert_per: rud.expert_per,
    market_order: rud.market_order,
    rate: rud.rate,
    nos: rud.nos,
    won: rud.won,
    dollar: rud.dollar,
    rebalancing_dollar: rud.rebalancing_dollar,
    stock_region: rud.stock_region,
    market_type_name: rud.market_type_name
  }));
}

// 리밸런싱 기록 조회
export const fetchRebalancingRecords = async (token: string, accountNumber: string): Promise<ApiResponse<GetRebalancingResponse[]>> => {
  try {
    const url = `${SPRING_SERVER_URL}/mystockaccount/record/account/${accountNumber}`;
    console.log('[리밸런싱 API] 기록 조회 요청:', {
      url,
      token: token ? '토큰 있음' : '토큰 없음',
      accountNumber,
      headers: {
        'Accept': 'application/json',
        'Platform': Platform.OS,
        'Authorization': `Bearer ${token}`
      }
    });

    const response = await axios.get(
      url,
      {
        headers: {
          'Accept': 'application/json',
          'Platform': Platform.OS,
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('[리밸런싱 API] 서버 응답:', {
      status: response.status,
      data: response.data
    });

    // 서버 응답이 없거나 빈 배열인 경우 더미 데이터 사용
    if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
      console.log('[리밸런싱 API] 서버 응답 없음, 더미 데이터 사용');
      const dummyRecords = getAccountRecords(accountNumber);
      const convertedRecords = convertDummyToApiResponse(dummyRecords);
      console.log('[리밸런싱 API] 더미 데이터:', convertedRecords);
      
      return {
        success: true,
        data: convertedRecords,
        isDummy: true
      };
    }
    
    return {
      success: true,
      data: response.data,
      isDummy: false
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // 404 에러는 계좌에 기록이 없는 정상적인 상황
      if (error.response?.status === 404) {
        console.log(`[리밸런싱 API] 계좌 ${accountNumber}에 기록이 없음 (404) - 빈 배열 반환`);
        return {
          success: true,
          data: [],
          isDummy: false
        };
      }

      console.error('[리밸런싱 API] 기록 조회 에러:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message || error.message,
        url: error.config?.url
      });
    } else {
      console.error('[리밸런싱 API] 기록 조회 네트워크 에러:', error);
    }

    // 404가 아닌 다른 에러 발생 시 더미 데이터 사용
    console.log('[리밸런싱 API] 에러로 인한 더미 데이터 사용');
    const dummyRecords = getAccountRecords(accountNumber);
    const convertedRecords = convertDummyToApiResponse(dummyRecords);
    console.log('[리밸런싱 API] 더미 데이터:', convertedRecords);

    return {
      success: true,
      data: convertedRecords,
      isDummy: true,
      error: error
    };
  }
};

// 리밸런싱 상세 정보 조회
export const fetchRebalancingDetail = async (token: string, recordId: number): Promise<ApiResponse<GetRebalancingStockResponse[]>> => {
  try {
    const url = `${SPRING_SERVER_URL}/mystockaccount/record/account/detail/${recordId}`;
    console.log('[리밸런싱 API] 상세 정보 조회 요청:', {
      url,
      token: token ? '토큰 있음' : '토큰 없음',
      recordId,
      headers: {
        'Accept': 'application/json',
        'Platform': Platform.OS,
        'Authorization': `Bearer ${token}`
      }
    });

    const response = await axios.get(
      url,
      {
        headers: {
          'Accept': 'application/json',
          'Platform': Platform.OS,
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('[리밸런싱 API] 상세 정보 응답:', {
      status: response.status,
      data: response.data
    });

    // 서버 응답이 없거나 빈 배열인 경우 더미 데이터 사용
    if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
      console.log('[리밸런싱 API] 상세 정보 없음, 더미 데이터 사용');
      const dummyDetails = getRecordRuds(recordId);
      const convertedDetails = convertDummyToApiStockResponse(dummyDetails);
      console.log('[리밸런싱 API] 더미 상세 데이터:', convertedDetails);
      
      return {
        success: true,
        data: convertedDetails,
        isDummy: true
      };
    }
    
    return {
      success: true,
      data: response.data,
      isDummy: false
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // 404 에러는 해당 기록의 상세 정보가 없는 정상적인 상황
      if (error.response?.status === 404) {
        console.log(`[리밸런싱 API] 기록 ID ${recordId}의 상세 정보가 없음 (404) - 빈 배열 반환`);
        return {
          success: true,
          data: [],
          isDummy: false
        };
      }

      console.error('[리밸런싱 API] 상세 정보 조회 에러:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message || error.message,
        url: error.config?.url
      });
    } else {
      console.error('[리밸런싱 API] 상세 정보 조회 네트워크 에러:', error);
    }

    // 404가 아닌 다른 에러 발생 시 더미 데이터 사용
    console.log('[리밸런싱 API] 에러로 인한 더미 데이터 사용');
    const dummyDetails = getRecordRuds(recordId);
    const convertedDetails = convertDummyToApiStockResponse(dummyDetails);
    console.log('[리밸런싱 API] 더미 상세 데이터:', convertedDetails);

    return {
      success: true,
      data: convertedDetails,
      isDummy: true,
      error: error
    };
  }
};