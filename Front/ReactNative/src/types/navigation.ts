// 경로: src/types/navigation.ts
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// 포트폴리오 구성 항목 인터페이스
interface PortfolioCompositionItem {
  name: string;
  targetPortion: number;
  stockRegion: number;
  marketTypeName?: string;
  currentShares?: number;
  currentValue?: number;
  rate?: number;
}

export type RootStackParamList = {
  '메인 페이지': undefined;
  '설정 페이지': undefined;
  'PortfolioEditor': { 
    portfolioId?: number;
    portfolioName?: string;
    portfolioMemo?: string;
    composition?: PortfolioCompositionItem[];
    totalBalance?: number;
    accountNumber?: string;
    recordDate?: string;
    profitRate?: number;
    selectedAccountNumber?: string;
    selectedAccountCompany?: string;
  } | undefined;
};

export type AuthStackParamList = {
  '로그인 페이지': undefined;
  '회원가입 페이지': undefined;
}
// 로그인 x
export type LoginPageNavigationProp = NativeStackNavigationProp<AuthStackParamList, '로그인 페이지'>;
export type SignUpPageNavigationProp = NativeStackNavigationProp<AuthStackParamList, '회원가입 페이지'>;

// 로그인 o
export type MainPageNavigationProp = NativeStackNavigationProp<RootStackParamList, '메인 페이지'>;
export type SettingsPageNavigationProp = NativeStackNavigationProp<RootStackParamList, '설정 페이지'>;
export type PortfolioEditorNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PortfolioEditor'>;
