// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithKakao: () => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  // 이메일/비밀번호 로그인
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      // 실제로는 서버 API 호출하여 인증
      // 현재는 간단한 유효성 검사만 수행
      if (email && password) {
        // 로그인 성공 상태 저장
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
      setIsLoggedIn(false);
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, loginWithKakao, logout, loading }}>
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
