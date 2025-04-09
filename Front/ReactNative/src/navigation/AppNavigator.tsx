// 경로: src/navigation/AppNavigator.tsx
// 흐름도: App.js > AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainPage from '../pages/MainPage';
import SetUpPage from '../pages/SetUpPage';
import ThemeToggle from '../components/common/ThemeToggle';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainPage} />
      <Stack.Screen name="Settings" component={SetUpPage} />
      <Stack.Screen name="Theme" component={ThemeToggle} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
