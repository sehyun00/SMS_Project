import React, { createContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from './colors';
import { typography } from './typography';

export const ThemeContext = createContext();

const THEME_PREFERENCE_KEY = 'theme_preference';

export const ThemeProvider = ({ children }) => {
  const [themeType, setThemeType] = useState('system');
  const [isDark, setIsDark] = useState(Appearance.getColorScheme() === 'dark');

  // 시스템 테마 변경 감지
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeType === 'system') {
        setIsDark(colorScheme === 'dark');
      }
    });

    return () => subscription.remove();
  }, [themeType]);

  // 저장된 테마 설정 불러오기
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedThemeType = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (savedThemeType) {
          setThemeType(savedThemeType);
          if (savedThemeType !== 'system') {
            setIsDark(savedThemeType === 'dark');
          }
        }
      } catch (error) {
        console.error('Failed to load theme preference', error);
      }
    };

    loadThemePreference();
  }, []);

  // 테마 변경 함수
  const setTheme = async (mode) => {
    setThemeType(mode);
    await AsyncStorage.setItem(THEME_PREFERENCE_KEY, mode);

    if (mode === 'system') {
      setIsDark(Appearance.getColorScheme() === 'dark');
    } else {
      setIsDark(mode === 'dark');
    }
  };

  // 현재 테마에 따른 색상 객체
  const colors = isDark ? darkColors : lightColors;

  // 완전한 테마 객체
  const theme = {
    colors,
    typography,
    isDark,
    setTheme,
    themeType,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
