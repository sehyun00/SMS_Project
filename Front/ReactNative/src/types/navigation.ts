// 경로: src/types/navigation.ts
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Main: undefined;
  Settings: undefined;
};

export type MainPageNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;
export type SettingsPageNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;
export type ThemePageNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Theme'>;
