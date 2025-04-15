// 경로: src/types/navigation.ts
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  '메인 페이지': undefined;
  '설정 페이지': undefined;
  '테마설정 페이지': undefined;
};

export type AuthStackParamList = {
  '로그인 페이지': undefined;
}

export type LoginPageNavigationProp = NativeStackNavigationProp<AuthStackParamList, '로그인 페이지'>;
export type MainPageNavigationProp = NativeStackNavigationProp<RootStackParamList, '메인 페이지'>;
export type SettingsPageNavigationProp = NativeStackNavigationProp<RootStackParamList, '설정 페이지'>;
export type ThemePageNavigationProp = NativeStackNavigationProp<RootStackParamList, '테마설정 페이지'>;
