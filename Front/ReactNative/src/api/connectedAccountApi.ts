import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SPRING_SERVER_URL, FLASK_SERVER_URL } from '../constants/config';

const apiUrl = SPRING_SERVER_URL;

// 토큰 가져오기 유틸리티 함수
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('토큰 가져오기 오류:', error);
    return null;
  }
};

// 커넥티드 계좌 정보 인터페이스
export interface ConnectedAccount {
  connectedId: string;
  accountNumber: string;
}

// 계좌 정보 인터페이스
export interface AccountInfo {
  accountNumber: string;
  company: string;
  returnRate: number;
}

// 잔고 정보 인터페이스
export interface BalanceInfo {
  accountNumber?: string;     // 계좌번호
  accountName?: string;       // 계좌명
  totalAmount?: string;       // 총평가금액
  balance?: string;           // 예수금
  stocks?: StockItem[];       // 보유주식 상세정보
  [key: string]: any;         // 기타 응답 필드
}

// 주식 종목 정보
export interface StockItem {
  name: string;               // 종목명
  price: string;              // 현재가
  quantity: string;           // 보유수량
  amount: string;             // 평가금액
  availableQuantity: string;  // 거래가능수량
  [key: string]: any;         // 기타 필드
}

/**
 * 사용자의 계좌와 연결된 ID 목록을 가져옵니다
 * @returns 연결된 계좌 ID 목록
 */
export const fetchConnectedAccounts = async (): Promise<ConnectedAccount[]> => {
  try {
    // 자체적으로 토큰 가져오기
    const token = await getAuthToken();
    
    // 헤더 기본값 설정
    const headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Platform': Platform.OS,
    };
    
    // 토큰이 있으면 헤더에 추가
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.post(`${apiUrl}/getAccountStock`, {}, {
      headers,
      withCredentials: true // 쿠키/인증 정보 포함
    });
    
    return response.data;
  } catch (error) {
    console.error('계좌 연결 ID 조회 실패:', error);
    
    throw error;
  }
};

/**
 * 사용자의 증권 계좌 정보를 가져옵니다
 * @returns 증권 계좌 정보 목록
 */
export const fetchStockAccounts = async (): Promise<AccountInfo[]> => {
  try {
    // 자체적으로 토큰 가져오기
    const token = await getAuthToken();
    
    // 헤더 기본값 설정
    const headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Platform': Platform.OS,
    };
    
    // 토큰이 있으면 헤더에 추가
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.get(`${apiUrl}/showstockaccounts`, {
      headers
    });
    
    // 응답 데이터 변환
    const accounts = response.data.map((acc: any) => ({
      accountNumber: acc.account,
      company: acc.company,
      returnRate: 0 // 기본값 0으로 설정
    }));
    
    return accounts;
  } catch (error) {
    console.error('증권 계좌 정보 조회 실패:', error);
    
    // 개발 모드에서 더미 데이터 반환
    if (process.env.NODE_ENV === 'development') {
      console.log('개발 모드: 계좌 정보 더미 데이터 반환');
      return [
        { accountNumber: "20901920648", company: "NH투자증권 모바일증권 나무", returnRate: 0 },
        { accountNumber: "716229952301", company: "삼성증권", returnRate: 0 }
      ];
    }
    
    throw error;
  }
};

/**
 * 증권사 코드를 API 요청 형식으로 변환
 * @param code 원래 증권사 코드
 * @returns API 요청에 맞는 형식의 코드
 */
const getAPIOrganizationCode = (code: string): string => {
  console.log(`증권사 코드 변환 중: ${code}`);
  
  // 삼성증권 코드 매핑
  const codeMap: Record<string, string> = {
    '0247': '0247',  // NH투자증권
    '1247': '1247'   // NH투자증권 모바일증권 나무
  };
  
  // 코드 매핑에 있으면 변환된 코드 반환
  if (code in codeMap) {
    console.log(`증권사 코드 ${code} -> ${codeMap[code]} 변환 완료`);
    return codeMap[code];
  }
  
  // 그 외에는 원래 코드 반환
  return code;
};

/**
 * 계좌의 잔고 정보를 조회합니다
 * @param connectedId 연결 ID
 * @param organization 증권사 코드
 * @param account 계좌번호
 * @param accountPassword 계좌 비밀번호
 * @returns 잔고 정보
 */
export const getStockBalance = async (
  connectedId: string,
  organization: string,
  account: string,
  accountPassword: string
): Promise<BalanceInfo> => {
  try {
    // 증권사 코드 변환
    const apiOrganizationCode = getAPIOrganizationCode(organization);
    console.log(`API 호출에 사용되는 organization 코드: ${apiOrganizationCode}`);
    
    const payload = {
      connectedId,
      organization: apiOrganizationCode,
      account,
      account_password: accountPassword, // Flask API는 스네이크 케이스 사용
    };
    
    console.log(`잔고 조회 API 요청 페이로드:`, { 
      ...payload, 
      account_password: '******' // 보안을 위해 비밀번호 마스킹
    });
    
    const response = await axios.post(`${FLASK_SERVER_URL}/stock/balance`, payload, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('잔고 조회 응답:', response.data);
    
    if (response.data.result.code === 'CF-00000') {
      // API 응답 구조에 맞게 데이터 파싱
      const apiData = response.data.data;
      
      // 주식 종목 정보 파싱 (NH투자증권 방식을 기본으로 사용)
      let stocks = [];
      
      // resItemList가 있는 경우 (NH투자증권 형식)
      if (apiData.resItemList) {
        stocks = (apiData.resItemList || []).map((item: any) => ({
          name: item.resIsName || item.resName || '알 수 없음',
          price: item.resPrice || item.resCurrentPrice || '0',
          quantity: item.resQuantity || '0',
          amount: item.resAmount || item.rsCurValAmt || '0',
          availableQuantity: item.resAvailQuantity || item.resQuantity || '0'
        }));
      } 
      // 삼성증권 등 다른 형식의 경우 - resAccountStock이 있으면 변환
      else if (apiData.resAccountStock && Array.isArray(apiData.resAccountStock)) {
        stocks = apiData.resAccountStock.map((item: any) => ({
          name: item.name || '알 수 없음',
          price: item.price || '0',
          quantity: item.quantity || '0',
          amount: item.amount || '0',
          availableQuantity: item.availableQuantity || item.quantity || '0'
        }));
      }
      
      // 공통 형식으로 반환 (NH투자증권 필드명 우선 사용, 없으면 다른 증권사 필드명 사용)
      return {
        accountNumber: apiData.resAccount || account,
        accountName: apiData.resAccount || apiData.resAccountName || account,
        totalAmount: apiData.rsTotAmt || apiData.rsTotValAmt || apiData.resAccountTotalAmt || '0',
        balance: apiData.resDepositReceived || apiData.resAccountBalance || '0',
        stocks
      };
    } else {
      throw new Error(response.data.result.message || '잔고 조회 실패');
    }
  } catch (error) {
    console.error('잔고 조회 실패:', error);
    
    throw error;
  }
};

export const verifySocialInfo = async (payload: any) => {
  return axios.post(`${FLASK_SERVER_URL}/stock/create-and-list`, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const registerAccount = async (data: any, token?: string) => {
  try {
    // 자체적으로 토큰 가져오기
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
    }
    
    return axios.post(`${apiUrl}/addstockaccount`, data, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Platform': Platform.OS,
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('계좌 등록 실패:', error);
    throw error;
  }
};

export const getAccountBalance = async (data: any) => {
  return axios.post(`${FLASK_SERVER_URL}/stock/balance`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}; 