// 경로: src/contants/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { Platform } from 'react-native'; // 플랫폼 정보 가져오기

interface AuthContextType {
  isLoggedIn: boolean;
  login: (user_id: string, password: string) => Promise<boolean>;
  signup: (user_id: string, password: string, name: string, phone_number: string) => Promise<{ success: boolean, errorMessage?: string }>;
  loginWithKakao: () => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  lastError: string | null; // 마지막 에러 메시지 저장
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 백엔드 서버 URL
const API_URL = Platform.OS === 'web'
  ? 'http://localhost:8081/upwardright'
  : 'http://192.168.0.9:8081/upwardright';

// 디버깅 로그 함수 - 빈 함수로 변경
const logDebug = (message: string, data?: any) => {
};

// Axios 인스턴스 생성
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Platform': Platform.OS, // 플랫폼 정보 전달 (iOS, android, web)
  },
  timeout: 15000, // 15초 타임아웃 설정
  // withCredentials: true, // 필요시 쿠키 전송 설정 추가
});

// 요청 인터셉터 설정
api.interceptors.request.use(
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

// 응답 인터셉터 설정
api.interceptors.response.use(
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true); // 초기 상태를 true로 설정
  const [lastError, setLastError] = useState<string | null>(null);

  // 앱 시작 시 저장된 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const value = await AsyncStorage.getItem('isLoggedIn');
        if (value === 'true') {
          setIsLoggedIn(true);
        }
      } catch (error) {
        setLastError('로그인 상태 확인 중 오류 발생');
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // 회원가입 함수
  const signup = async (
    user_id: string,
    password: string,
    name: string,
    phone_number: string
  ): Promise<{ success: boolean, errorMessage?: string }> => {
    setLoading(true);

    try {
      const response = await api.post(API_URL + '/signup', {
        user_id, password, name, phone_number,
      });

      setLastError(null);
      return { success: true };
    } catch (error) {
      let errorMessage = '회원가입 처리 중 오류가 발생했습니다';

      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }

      setLastError(errorMessage);
      return { success: false, errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // 이메일/비밀번호 로그인
  const login = async (user_id: string, password: string): Promise<boolean> => {
    setLoading(true);
    setLastError(null);

    try {
      // Network 연결 테스트
      try {
        await axios.get('https://www.google.com', { timeout: 5000 });
      } catch (netError) {
        // 에러 처리 로직
      }

      // 백엔드 서버에 로그인 요청
      const response = await api.post(API_URL + '/login', { user_id, password });

      // 토큰 저장
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('isLoggedIn', 'true');
        setIsLoggedIn(true);
        return true;
      } else {
        setLastError('서버 응답에 인증 토큰이 없습니다');
        return false;
      }
    } catch (error) {
      let errorMessage = '알 수 없는 오류';

      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;

        // 자세한 에러 타입 분석
        if (!error.response) {
          errorMessage = '서버 연결 실패 (네트워크 오류)';
        } else if (error.response.status === 401) {
          errorMessage = '유효하지 않은 아이디 또는 비밀번호';
        } else if (error.response.status === 404) {
          errorMessage = '서버 API 엔드포인트를 찾을 수 없습니다';
        } else if (error.response.status >= 500) {
          errorMessage = '서버 내부 오류';
        }
      }

      setLastError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 카카오 로그인
  const loginWithKakao = async (): Promise<boolean> => {
    setLoading(true);
    setLastError(null);

    try {
      // 실제로는 카카오 SDK를 통한 인증 처리
      // 현재는 항상 성공 처리
      await AsyncStorage.setItem('isLoggedIn', 'true');
      setIsLoggedIn(true);
      return true;
    } catch (error) {
      setLastError('카카오 로그인 중 오류 발생');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const logout = async () => {
    setLoading(true);

    try {
      await AsyncStorage.removeItem('isLoggedIn');
      await AsyncStorage.removeItem('authToken');
      setIsLoggedIn(false);
      setLastError(null);
    } catch (error) {
      setLastError('로그아웃 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      isLoggedIn,
      login,
      signup,
      loginWithKakao,
      logout,
      loading,
      lastError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// 커스텀 훅으로 AuthContext 사용 편의 제공
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다');
  }
  return context;
};
