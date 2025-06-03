import axios from 'axios';
import { FLASK_SERVER_URL, SPRING_SERVER_URL } from '../constants/config';
import { Platform } from 'react-native';

export const fetchAccountData = async () => {
  try {
    const response = await axios.get(`${FLASK_SERVER_URL}/accounts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching account data:', error);
    throw error;
  }
};

export const fetchRebalancingRecords = async () => {
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