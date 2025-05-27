import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { SPRING_SERVER_URL } from '../constants/config';

// API URL에서 /upwardright 제거
const API_URL = SPRING_SERVER_URL.replace('/upwardright', '');

// 이메일 인증 응답 인터페이스
export interface EmailVerificationResponse {
  success: boolean;
  message: string;
}

// 이메일 인증 요청 인터페이스
export interface SendCodeRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

// 인증이 필요한 API용 인스턴스
const authApi: AxiosInstance = axios.create({
  baseURL: SPRING_SERVER_URL, // /upwardright 포함
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Platform': Platform.OS,
  },
  timeout: 15000,
});

// 인증이 필요없는 public API용 인스턴스
const publicApi: AxiosInstance = axios.create({
  baseURL: API_URL, // /upwardright 제거된 URL
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Platform': Platform.OS,
  },
  timeout: 15000,
});

// 요청 인터셉터 설정 (인증이 필요한 API용)
authApi.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정 (인증이 필요한 API용)
authApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response && error.response.status === 401) {
        await AsyncStorage.removeItem('isLoggedIn');
        await AsyncStorage.removeItem('authToken');
      }
    }
    return Promise.reject(error);
  }
);

export const signup = async (user_id: string, password: string, name: string, phone_number: string) => {
  return authApi.post('/upwardright/signup', { user_id, password, name, phone_number });
};

export const login = async (user_id: string, password: string) => {
  return authApi.post('/upwardright/login', { user_id, password });
};

// 이메일 인증 관련 API 함수 (publicApi 사용)
export const sendVerificationEmail = async (email: string) => {
  try {
    const requestData: SendCodeRequest = {
      email: email
    };
    const response = await publicApi.post('/emails/verify', requestData);
    console.log('이메일 인증 요청 응답:', response);
    return response.status === 200;
  } catch (error) {
    console.error('이메일 인증 코드 전송 실패:', error);
    if (axios.isAxiosError(error)) {
      console.error('에러 상세:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
        config: error.config // 요청 설정도 로깅
      });
    }
    throw error;
  }
};

export const verifyEmailCode = async (email: string, code: string) => {
  try {
    const requestData: VerifyCodeRequest = {
      email: email,
      code: code
    };
    const response = await publicApi.get<EmailVerificationResponse>('/emails/verify', {
      params: requestData
    });
    console.log('인증 코드 확인 응답:', response);
    return response.data;
  } catch (error) {
    console.error('이메일 인증 코드 확인 실패:', error);
    if (axios.isAxiosError(error)) {
      console.error('에러 상세:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
        config: error.config // 요청 설정도 로깅
      });
    }
    throw error;
  }
}; 