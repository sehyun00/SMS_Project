// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  isLoggedIn: boolean;
  login: (user_id: string, password: string) => Promise<boolean>;
  signup: (user_id: string, password: string, name: string, phone_number: string) => Promise<boolean>; // 회원가입 함수 추가
  loginWithKakao: () => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 백엔드 서버 URL
const API_URL = 'http://localhost:8081/upwardright';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // 앱 시작 시 저장된 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const value = await AsyncStorage.getItem('isLoggedIn');
        if (value === 'true') {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('로그인 상태 확인 중 오류 발생:', error);
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
  ): Promise<boolean> => {
    setLoading(true);
    try {
      // 백엔드 서버에 회원가입 요청
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id,         // 이메일
          password,        // 비밀번호
          name,            // 이름
          phone_number,    // 전화번호
          // membership은 백엔드에서 기본값으로 설정
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('회원가입 실패:', data.message || '알 수 없는 오류');
        return false;
      }

      console.log('회원가입 성공:', data);
      // 회원가입 직후 자동 로그인을 원한다면 아래 주석을 해제
      // await AsyncStorage.setItem('authToken', data.token);
      // await AsyncStorage.setItem('isLoggedIn', 'true');
      // setIsLoggedIn(true);
      
      return true;
    } catch (error) {
      console.error('회원가입 중 오류 발생:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 이메일/비밀번호 로그인
  const login = async (user_id: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      // 백엔드 서버에 로그인 요청
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('로그인 실패:', data.message || '알 수 없는 오류');
        return false;
      }

      // 토큰 저장 (백엔드에서 JWT 등의 토큰을 반환한다고 가정)
      if (data.token) {
        await AsyncStorage.setItem('authToken', data.token);
        await AsyncStorage.setItem('isLoggedIn', 'true');
        setIsLoggedIn(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('로그인 중 오류 발생:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 카카오 로그인
  const loginWithKakao = async (): Promise<boolean> => {
    setLoading(true);
    try {
      // 실제로는 카카오 SDK를 통한 인증 처리
      // 현재는 항상 성공 처리
      await AsyncStorage.setItem('isLoggedIn', 'true');
      setIsLoggedIn(true);
      return true;
    } catch (error) {
      console.error('카카오 로그인 중 오류 발생:', error);
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
      await AsyncStorage.removeItem('authToken'); // 토큰도 제거
      setIsLoggedIn(false);
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, signup, loginWithKakao, logout, loading }}>
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
