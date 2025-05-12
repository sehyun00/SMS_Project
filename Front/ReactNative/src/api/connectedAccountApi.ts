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

export const verifySocialInfo = async (payload: any) => {
  return axios.post(`${FLASK_SERVER_URL}/stock/create-and-list`, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const registerAccount = async (data: any) => {
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