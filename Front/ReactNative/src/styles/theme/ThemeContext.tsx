// src/styles/theme/ThemeContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { lightTheme, darkTheme } from './index';
import { Theme } from '../../types/theme';

// 테마 컨텍스트 인터페이스 정의
interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

// 기본값으로 사용할 컨텍스트 생성
const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

// ThemeProvider Props 인터페이스
interface ThemeProviderProps {
  children: ReactNode;
}

// ThemeProvider 컴포넌트 정의
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const theme = isDark ? darkTheme : lightTheme;

  // 테마 토글 함수
  const toggleTheme = (): void => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 커스텀 훅으로 테마 사용을 간편하게 제공
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
