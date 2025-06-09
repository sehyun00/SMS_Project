import axios from 'axios';
import { FLASK_SERVER_URL, SPRING_SERVER_URL, USE_CODEF_DUMMY_DATA } from '../constants/config';
import { Platform } from 'react-native';
import { DUMMY_ACCOUNT_DATA, DUMMY_REBALANCING_RECORDS } from '../data/dummyData';

export const fetchAccountData = async () => {
  // 더미 모드가 활성화된 경우
  if (USE_CODEF_DUMMY_DATA) {
    console.log('더미 모드: 계좌 데이터 더미 반환');
    // 실제 API 호출을 시뮬레이션하기 위해 약간의 지연 추가
    await new Promise(resolve => setTimeout(resolve, 500));
    return DUMMY_ACCOUNT_DATA;
  }

  try {
    const response = await axios.get(`${FLASK_SERVER_URL}/accounts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching account data:', error);
    throw error;
  }
};

export const fetchRebalancingRecords = async () => {
  // 더미 모드가 활성화된 경우
  if (USE_CODEF_DUMMY_DATA) {
    console.log('더미 모드: 리밸런싱 기록 더미 반환');
    // 실제 API 호출을 시뮬레이션하기 위해 약간의 지연 추가
    await new Promise(resolve => setTimeout(resolve, 600));
    return DUMMY_REBALANCING_RECORDS;
  }

  try {
    const response = await axios.get(`${FLASK_SERVER_URL}/rebalancing-records`);
    return response.data;
  } catch (error) {
    console.error('Error fetching rebalancing records:', error);
    throw error;
  }
};

// 스프링 서버에서 계좌 정보를 가져오는 API 함수
export const fetchStockAccounts = async (token: string) => {
  try {
    const response = await axios.get(
      `${SPRING_SERVER_URL}/showstockaccounts`,
      {
        headers: {
          'Accept': 'application/json',
          'Platform': Platform.OS,
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    // 응답 데이터 변환 - principal 값 포함
    const accounts = response.data.map((acc: any) => ({
      company: acc.company,
      accountNumber: acc.account,
      principal: acc.principal || 0, // 백엔드에서 받은 principal 값 포함
      returnRate: 0
    }));
    
    console.log('계좌 API 응답:', accounts); // principal 값 확인용 로그
    
    return {
      success: true,
      data: accounts
    };
  } catch (error) {
    console.error('계좌 API 에러:', error);
    console.error('API URL:', `${SPRING_SERVER_URL}/showstockaccounts`);
    return {
      success: false,
      error: error
    };
  }
}; 