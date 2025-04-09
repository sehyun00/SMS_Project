// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// 파일 확장자 확인 및 경로 검증
import AppNavigator from './src/navigation/AppNavigator'; 

// ThemeProvider 임포트 방식 확인
import { ThemeProvider } from './src/styles/theme/ThemeContext';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
