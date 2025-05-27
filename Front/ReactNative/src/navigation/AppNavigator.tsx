// 경로: src/navigation/AppNavigator.tsx
// 흐름도: App.js > AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigatorProps } from '@react-navigation/native-stack';

// 컴포넌트 임포트
import MainPage from '../screens/main/MainPage';
import SetUpPage from '../screens/setup/SetUpPage';
import PortfolioEditor from '../components/portfolio/PortfolioEditor';

// 로그인 상태에 따른 네비게이트
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* 메인 페이지 */}
      <Stack.Screen name="메인 페이지" component={MainPage} />
      
      {/* 설정 페이지 */}
      <Stack.Screen name="설정 페이지" component={SetUpPage} />
      
      {/* 포트폴리오 에디터 페이지 */}
      <Stack.Screen name="PortfolioEditor" component={PortfolioEditor} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
