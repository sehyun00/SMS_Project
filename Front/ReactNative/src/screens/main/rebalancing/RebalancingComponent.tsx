// 파일 경로: src/components/RebalancingComponent.tsx
// 컴포넌트 흐름: App.js > AppNavigator.js > MainPage.jsx > RebalancingComponent.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, FlatList, Alert, Dimensions, InteractionManager, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MainPageNavigationProp } from '../../../types/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { fetchStockAccounts } from '../../../api/homeApi';
import { findSecuritiesFirmByName } from '../../../data/organizationData';
import { fetchConnectedAccounts, getAccountBalance } from '../../../api/connectedAccountApi';
import { FLASK_SERVER_URL } from '../../../constants/config';
import axios from 'axios';
import { useAccounts } from '../../../context/AccountsContext';
import AddPortfolioModal from '../../../components/common/modals/AddPortfolioModal';
import AccountPasswordModal from '../../../components/common/modals/AccountPasswordModal';
import { fetchRebalancingRecords, fetchRebalancingDetail, saveRebalancingRecord, saveRebalancingStocks } from '../../../api/rebalancingApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 컴포넌트 임포트
import RForeignComponent from './RForeignComponent';
import RDomesticComponent from './RDomesticComponent';
import RMoneyComponent from './RMoneyComponent';
import RAnalysisComponent from './RAnalysisComponent';

// 더미 데이터 임포트 - 새로운 구조
import {
  dummyAccounts,
  dummyRecords,
  getAccountRecords,
  getRecordRuds,
  calculateRecordValue,
  getCurrentExchangeRate
} from '../../../data/dummyData';

// 스타일 임포트
import withTheme from '../../../hoc/withTheme';
import createStyles from '../../../styles/components/rebalancingComponent.styles';

// 커스텀 훅 임포트
import { useExchangeRate } from '../../../hooks/useExchangeRate';

// 공통 Theme 타입 가져오기
import { Theme } from '../../../types/theme';

// 계좌 선택 컴포넌트 임포트
import AccountSelectorComponent from '../../../components/account/AccountSelectorComponent';

// NLP API 임포트
import { analyzePortfolio, PortfolioAnalysisResponse } from '../../../api/nlpApi';
import { getStockCodeFromName } from '../../../data/stockCodeMapping';

// API에서 가져오는 계좌 정보 인터페이스
interface ApiAccountInfo {
  company: string;
  accountNumber: string;
  principal?: number; // 백엔드에서 받는 원금 값
  returnRate: number;
}

// 계좌 정보 인터페이스
interface AccountInfo {
  name: string;
  number: string;
  principal: number;
  valuation: number;
  dailyProfit: number;
  dailyProfitPercent: number;
  totalProfit: number;
  totalProfitPercent: number;
}

// dummyAccounts 인터페이스 추가
interface DummyAccount {
  company: string;
  account: string;
  principal: number;
  pre_principal: number;
}

// 현금 항목 데이터 인터페이스
interface CashItem {
  name: string;
  value: number;
  krwValue: number;
  targetPortion: number;
  rebalanceAmount: number;
}

// 주식 데이터 인터페이스
interface StockItem {
  name: string;
  ticker: string;
  value: number;
  krwValue: number;
  percentChange: number;
  targetPortion: number;
  rebalanceAmount: number;
  market_order?: number;
  // 실시간 주식 가격 정보 추가
  currentPrice?: number;  // 현재 주식 가격
  requiredShares?: number; // 필요한 주식 수 (+ 매수, - 매도)
}

// 컴포넌트 props 인터페이스 정의
interface RebalancingComponentProps {
  theme: Theme;
  navigation?: MainPageNavigationProp;
}

import CurrencyToggle from '../../../components/common/ui/CurrencyToggle';

// 파일 상단에 타입 정의 추가
interface GetRebalancingResponse {
  record_id: number;
  account: string;
  user_id: string;
  record_date: string;
  total_balance: number;
  record_name: string;
  memo: string;
  profit_rate: number;
}

interface GetRebalancingStockResponse {
  record_id: number;
  stock_name: string;
  expert_per: number;
  market_order: number;
  rate: number;
  nos: number;
  won: number;
  dollar: number;
  rebalancing_dollar: number;
  stock_region: number;
  market_type_name: string;
}

// 더미 데이터 타입 정의 추가
interface Record extends GetRebalancingResponse {
  user_id: string;
}

interface Rud extends GetRebalancingStockResponse {
  rebalancing_dollar: number;
  market_type_name: string;
}

const RebalancingComponent: React.FC<RebalancingComponentProps> = ({ theme, navigation }) => {
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const defaultNavigation = useNavigation<MainPageNavigationProp>();
  const { loggedToken } = useAuth();
  
  // navigation prop이 제공되지 않은 경우 useNavigation 훅 사용
  const nav = navigation || defaultNavigation;
  
  // 스크롤뷰 참조
  const scrollViewRef = useRef<ScrollView>(null);
  
  // 기본 상태들
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [accountDropdownVisible, setAccountDropdownVisible] = useState(false);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [currentRecordIndex, setCurrentRecordIndex] = useState(0);
  
  // API 관련 상태들
  const [stockAccounts, setStockAccounts] = useState<ApiAccountInfo[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [accountRecords, setAccountRecords] = useState<GetRebalancingResponse[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [recordDetails, setRecordDetails] = useState<GetRebalancingStockResponse[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // 실시간 계좌 잔고 상태
  const [realtimeBalance, setRealtimeBalance] = useState<any>(null);
  const [isLoadingRealtimeBalance, setIsLoadingRealtimeBalance] = useState(false);
  
  // connectedId 정보 상태
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  
  // 계좌 정보 Context 사용
  const { accounts: savedAccounts, addAccount: saveAccount, updateAccount } = useAccounts();
  
  // 카드 너비 계산 수정
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth; // 전체 화면 너비로 설정
  
  // 현재 현금 정보 가져오기
  const { exchangeRate, loading: exchangeRateLoading } = useExchangeRate();
  const currentExchangeRate = exchangeRate || getCurrentExchangeRate();

  // 화폐 단위 상태 (기본값: 달러)
  const [currencyType, setCurrencyType] = useState<'dollar' | 'won'>('dollar');

  // 포트폴리오 분석 관련 상태
  const [analysisResult, setAnalysisResult] = useState<PortfolioAnalysisResponse | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | undefined>(undefined);

  // 증권사 이름으로 기관코드 찾기
  const getOrganizationCode = (companyName: string): string => {
    const firm = findSecuritiesFirmByName(companyName);
    if (firm) {
      console.log(`증권사 ${companyName} -> 코드 ${firm.code} 변환 성공`);
      return firm.code;
    } else {
      console.warn(`증권사 코드를 찾을 수 없음: ${companyName}`);
      // 기본 코드 반환 (삼성증권)
      return '0240';
    }
  };
  
  // 로컬에 저장된 계좌 정보 찾기
  const findSavedAccount = (accountNumber: string, organization: string) => {
    return savedAccounts.find(acc => 
      acc.account === accountNumber && acc.organization === organization
    );
  };

  // 계좌 비밀번호 모달 상태
  const [showAccountPasswordModal, setShowAccountPasswordModal] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [selectedAccountForPassword, setSelectedAccountForPassword] = useState<{account: ApiAccountInfo, connectedId: string} | null>(null);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  // 계좌별 비밀번호 상태 추적 추가
  const [accountPasswordStatus, setAccountPasswordStatus] = useState<{[key: string]: boolean}>({});

  // 계좌 비밀번호 확인
  const checkSavedPassword = async (accountNumber: string, organization: string): Promise<boolean> => {
    // Context에서 계좌 정보 찾기
    const savedAccount = findSavedAccount(accountNumber, organization);
    const hasContextPassword = !!(savedAccount && savedAccount.account_password);
    
    // AsyncStorage에서 확인
    let hasDirectPassword = false;
    try {
      const directPassword = await AsyncStorage.getItem(`direct_password_${accountNumber}`);
      hasDirectPassword = !!directPassword;
    } catch (err) {
      console.error('직접 저장소 확인 오류:', err);
    }
    
    return hasContextPassword || hasDirectPassword;
  };

  // 계좌 비밀번호 저장 - RecordComponent와 동일한 로직
  const saveAccountPassword = async () => {
    if (!selectedAccountForPassword || !accountPassword) {
      Alert.alert('알림', '계좌 비밀번호를 입력해주세요.');
        return;
      }
      
      try {
      setSaveInProgress(true);
      setPasswordError('');
      
      const organization = getOrganizationCode(selectedAccountForPassword.account.company);
      const accountNumber = selectedAccountForPassword.account.accountNumber;
      const connectedId = selectedAccountForPassword.connectedId;
      
      // organization 값이 숫자로만 구성되어 있는지 검증
      if (!/^\d+$/.test(organization)) {
        console.error('[계좌 비밀번호 저장] 잘못된 기관코드 형식:', organization);
        throw new Error(`잘못된 기관코드 형식입니다: ${organization}`);
      }
      
      console.log('[계좌 비밀번호 저장] 회사명:', selectedAccountForPassword.account.company);
      console.log('[계좌 비밀번호 저장] 변환된 기관코드:', organization);
      console.log('[계좌 비밀번호 저장] 계좌번호:', accountNumber);
      console.log('[계좌 비밀번호 저장] connectedId:', connectedId);
      
      console.log('계좌 비밀번호 확인 시도:', {
        connectedId,
        organization,
        account: accountNumber,
        account_password: '******'
      });
      
      try {
        const response = await getAccountBalance({
          organization,
          connectedId,
          account: accountNumber,
          account_password: accountPassword
        });
        
        if (response.data) {
          console.log('계좌 비밀번호 확인 성공');
          
          const accountInfo = {
            account: accountNumber,
            account_password: accountPassword,
            connectedId: connectedId,
            organization: organization
          };
          
          const existingAccount = findSavedAccount(accountNumber, organization);
          
          if (existingAccount) {
            console.log(`기존 계좌 정보 업데이트: ${accountNumber}`);
            const result = await updateAccount(accountInfo);
            if (!result) {
              console.error('계좌 정보 업데이트 실패');
            }
        } else {
            console.log(`새 계좌 정보 저장: ${accountNumber}`);
            const result = await saveAccount(accountInfo);
            if (!result) {
              console.error('계좌 정보 저장 실패');
            }
          }
          
          try {
            await AsyncStorage.setItem(`direct_password_${accountNumber}`, accountPassword);
            console.log(`계좌 ${accountNumber}의 비밀번호 직접 저장 완료`);
          } catch (err) {
            console.error('직접 저장 오류:', err);
          }
          
          Alert.alert('성공', '계좌 비밀번호가 저장되었습니다.', [
            { text: '확인', onPress: () => {
              setShowAccountPasswordModal(false);
              setAccountPassword('');
              setSelectedAccountForPassword(null);
              setPasswordError('');
              
              // 해당 계좌의 비밀번호 상태 업데이트
              setAccountPasswordStatus(prev => ({
                ...prev,
                [accountNumber]: true
              }));
              
              // 리밸런싱 기록 다시 조회
              if (selectedAccountForPassword) {
                loadRebalancingRecords(selectedAccountForPassword.account.accountNumber);
              }
            }}
          ]);
        } else {
          throw new Error('계좌 비밀번호가 올바르지 않습니다.');
        }
      } catch (error: any) {
        console.error('계좌 비밀번호 확인 실패:', error);
        setPasswordError(error.response?.data?.result?.message || error.message || '계좌 비밀번호가 올바르지 않습니다.');
      }
    } catch (error: any) {
      console.error('비밀번호 저장 오류:', error);
      setPasswordError(error.message || '계좌 비밀번호 저장 중 오류가 발생했습니다.');
      } finally {
      setSaveInProgress(false);
    }
  };

  // 계좌 비밀번호 필요 시 모달 표시
  const handleAccountPasswordRequired = (account: ApiAccountInfo, connectedId: string) => {
    console.log('[비밀번호 모달] 모달 표시 함수 호출:', {
      account: account.accountNumber,
      company: account.company,
      connectedId,
      currentModalState: showAccountPasswordModal
    });
    
    setSelectedAccountForPassword({ account, connectedId });
    setAccountPassword('');
    setPasswordError('');
    setShowAccountPasswordModal(true);
    
    console.log('[비밀번호 모달] 모달 상태 설정 완료:', {
      selectedAccount: account.accountNumber,
      modalShouldShow: true
    });
  };

  // 리밸런싱 기록 조회
  const loadRebalancingRecords = async (accountNumber: string) => {
    if (!loggedToken) {
      console.log('리밸런싱 기록 조회 중단: 토큰 없음');
        return;
      }
      
    setIsLoadingRecords(true);
    try {
      console.log('[리밸런싱] 기록 조회 시도:', {
        account: accountNumber,
        token: loggedToken ? '토큰 있음' : '토큰 없음'
      });
      
      // API 호출
      const result = await fetchRebalancingRecords(loggedToken, accountNumber);
      console.log('[리밸런싱] 기록 조회 결과:', {
        success: result.success,
        isDummy: result.isDummy,
        recordCount: result.data?.length || 0
      });
      
      if (result.success && result.data !== undefined) {
        setAccountRecords(result.data);
        
        // 기록이 있으면 첫 번째 기록 선택
        if (result.data.length > 0) {
          setSelectedRecordId(result.data[0].record_id);
          console.log('[리밸런싱] 첫 번째 기록 선택:', result.data[0].record_id);
        } else {
          console.log('[리밸런싱] 해당 계좌에 리밸런싱 기록이 없음');
          setSelectedRecordId(null);
        }
      } else {
        console.log('[리밸런싱] API 호출 실패, 더미 데이터 사용');
        const dummyRecords = getAccountRecords(accountNumber);
        const convertedRecords = dummyRecords.map(record => ({
          record_id: record.record_id,
          account: record.account,
          user_id: record.user_id,
          record_date: record.record_date,
          total_balance: record.total_balance,
          record_name: record.record_name,
          memo: record.memo,
          profit_rate: record.profit_rate
        }));
        setAccountRecords(convertedRecords);
        if (convertedRecords.length > 0) {
          setSelectedRecordId(convertedRecords[0].record_id);
        }
      }
      
      // 실시간 계좌 잔고 조회 (원금과 원화 현금을 위해)
      await loadRealtimeAccountBalance(accountNumber);
      
      // 데이터 로드 완료 후 스크롤 위치 초기화
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: 0, animated: false });
        setCurrentPageIndex(0);
        setCurrentRecordIndex(0);
        console.log('[리밸런싱] 스크롤 위치 초기화 완료');
      }, 100);
      
    } catch (error) {
      console.error('[리밸런싱] 기록 조회 중 예상치 못한 오류:', error);
      console.log('[리밸런싱] 예외 발생으로 더미 데이터 사용');
      const dummyRecords = getAccountRecords(accountNumber);
      const convertedRecords = dummyRecords.map(record => ({
        record_id: record.record_id,
        account: record.account,
        user_id: record.user_id,
        record_date: record.record_date,
        total_balance: record.total_balance,
        record_name: record.record_name,
        memo: record.memo,
        profit_rate: record.profit_rate
      }));
      setAccountRecords(convertedRecords);
      if (convertedRecords.length > 0) {
        setSelectedRecordId(convertedRecords[0].record_id);
      }
      
      // 더미 데이터 사용 시에도 실시간 잔고 조회 시도
      await loadRealtimeAccountBalance(accountNumber);
      
      // 더미 데이터 로드 후에도 스크롤 위치 초기화
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: 0, animated: false });
        setCurrentPageIndex(0);
        setCurrentRecordIndex(0);
        console.log('[리밸런싱] 더미 데이터 로드 후 스크롤 위치 초기화 완료');
      }, 100);
    } finally {
      setIsLoadingRecords(false);
    }
  };
    
  // 유연한 계좌번호 매칭 함수
  const findConnectedIdByAccount = (accountNumber: string): string | null => {
    // MyStockAccountComponent와 동일한 방식으로 인덱스 기반 매칭 사용
    const accountIndex = stockAccounts.findIndex(acc => acc.accountNumber === accountNumber);
    
    if (accountIndex === -1) {
      console.log(`계좌 ${accountNumber}를 stockAccounts에서 찾을 수 없음`);
      return null;
    }
    
    // 인덱스에 맞는 connectedId 사용
    if (connectedAccounts.length > accountIndex) {
      const connectedAccount = connectedAccounts[accountIndex];
      if (typeof connectedAccount === 'string') {
        console.log(`계좌 ${accountNumber} (인덱스: ${accountIndex})와 connectedId ${connectedAccount} 매칭됨`);
        return connectedAccount;
      } else if (typeof connectedAccount === 'object' && connectedAccount) {
        const connectedId = connectedAccount.connectedId || '';
        console.log(`계좌 ${accountNumber} (인덱스: ${accountIndex})와 connectedId ${connectedId} 매칭됨`);
        return connectedId;
      }
    } else if (connectedAccounts.length > 0) {
      // 인덱스가 없으면 첫 번째 connectedId 사용
      const firstAccount = connectedAccounts[0];
      if (typeof firstAccount === 'string') {
        console.log(`계좌 ${accountNumber}: 인덱스 매칭 실패, 첫 번째 connectedId ${firstAccount} 사용`);
        return firstAccount;
      } else if (typeof firstAccount === 'object' && firstAccount) {
        const connectedId = firstAccount.connectedId || '';
        console.log(`계좌 ${accountNumber}: 인덱스 매칭 실패, 첫 번째 connectedId ${connectedId} 사용`);
        return connectedId;
      }
    }
    
    return null;
  };

  // 계좌 선택 핸들러 (계좌번호 기반 매칭으로 수정)
  const handleAccountChange = (index: number) => {
    console.log(`계좌 선택: ${index}번째 계좌`);
    
    // 선택된 계좌의 인덱스 업데이트
    setSelectedAccountIndex(index);
    
    // 현재 선택된 계좌의 정보 가져오기
    const account = stockAccounts[index];
    
    // 유연한 계좌번호 매칭으로 connectedId 찾기
    const connectedId = findConnectedIdByAccount(account.accountNumber);
    
          if (connectedId) {
      console.log(`계좌 ${account.accountNumber}와 connectedId ${connectedId} 매칭됨`);
            setSelectedAccountForPassword({account, connectedId});
      
      // 증권사 코드 찾기
      const organizationCode = getOrganizationCode(account.company);
      
      // 저장된 계좌 정보 확인
      const savedAccount = findSavedAccount(account.accountNumber, organizationCode);
      
      if (savedAccount && savedAccount.account_password) {
        // 저장된 비밀번호가 있으면 바로 리밸런싱 기록 조회
        console.log('저장된 계좌 비밀번호 사용');
        loadRebalancingRecords(account.accountNumber);
      } else {
        // 저장된 비밀번호가 없으면 비밀번호 입력 요청
        setAccountPassword("");
        setPasswordError("");
        console.log('저장된 비밀번호 없음, 모달 표시');
              setShowAccountPasswordModal(true);
      }
    } else {
      console.error(`계좌 ${account.accountNumber}에 매칭되는 connectedId를 찾을 수 없음`);
      console.log('Available connectedAccounts:', connectedAccounts);
      Alert.alert('오류', '해당 계좌의 연결 정보를 찾을 수 없습니다. 계좌를 다시 등록해주세요.');
    }
  };

  // 스크롤 위치 강제 초기화 (페이지 진입 시 오른쪽 치우침 방지)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
        setCurrentPageIndex(0);
        setCurrentRecordIndex(0);
        console.log('[초기화] 스크롤 위치 강제 초기화 완료');
      }
    }, 500); // 500ms 후에 실행

    return () => clearTimeout(timer);
  }, [accountRecords]); // accountRecords가 변경될 때마다 실행

  // 리밸런싱 상세 정보 조회
  useEffect(() => {
    const loadRebalancingDetail = async () => {
      if (!loggedToken || !selectedRecordId) {
        console.log('리밸런싱 상세 정보 조회 중단:', {
          hasToken: !!loggedToken,
          recordId: selectedRecordId
        });
        return;
      }
      
      setIsLoadingDetails(true);
      try {
        // API 호출
        const result = await fetchRebalancingDetail(loggedToken, selectedRecordId);
        console.log('[리밸런싱] 상세 정보 조회 결과:', {
          success: result.success,
          isDummy: result.isDummy,
          detailCount: result.data?.length || 0
        });
        
        if (result.success && result.data !== undefined) {
          setRecordDetails(result.data);
          
          if (result.data.length === 0) {
            console.log('[리밸런싱] 해당 기록에 상세 정보가 없음');
          }
        } else {
          console.log('[리밸런싱] 상세 정보 API 호출 실패, 더미 데이터 사용');
          const dummyDetails = getRecordRuds(selectedRecordId);
          const convertedDetails = dummyDetails.map(rud => ({
            record_id: rud.record_id,
            stock_name: rud.stock_name,
            expert_per: rud.expert_per,
            market_order: rud.market_order,
            rate: rud.rate,
            nos: rud.nos,
            won: rud.won,
            dollar: rud.dollar,
            rebalancing_dollar: rud.rebalancing_dollar,
            stock_region: rud.stock_region,
            market_type_name: rud.market_type_name
          }));
          setRecordDetails(convertedDetails);
        }
      } catch (error) {
        console.error('[리밸런싱] 상세 정보 조회 중 예상치 못한 오류:', error);
        console.log('[리밸런싱] 예외 발생으로 더미 데이터 사용');
        const dummyDetails = getRecordRuds(selectedRecordId);
        const convertedDetails = dummyDetails.map(rud => ({
          record_id: rud.record_id,
          stock_name: rud.stock_name,
          expert_per: rud.expert_per,
          market_order: rud.market_order,
          rate: rud.rate,
          nos: rud.nos,
          won: rud.won,
          dollar: rud.dollar,
          rebalancing_dollar: rud.rebalancing_dollar,
          stock_region: rud.stock_region,
          market_type_name: rud.market_type_name
        }));
        setRecordDetails(convertedDetails);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    loadRebalancingDetail();
  }, [selectedRecordId, loggedToken]);

  // recordRuds를 실제 API 데이터로 대체
  const recordRuds = useMemo(() => {
    return recordDetails;
  }, [recordDetails]);

  // 리밸런싱 기록 토글(드롭다운) 상태
  const [recordDropdownVisible, setRecordDropdownVisible] = useState(false);

  // 선택된 리밸런싱 기록 확정 (없으면 가장 최근 것으로)
  const currentRecordId = useMemo(() => {
    if (selectedRecordId !== null) {
      return selectedRecordId;
    }
    
    if (accountRecords.length === 0) return null;
    
    // 가장 최신 날짜 기록 선택
    const sortedRecords = [...accountRecords].sort(
      (a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
    );
    return sortedRecords[0].record_id;
  }, [selectedRecordId, accountRecords]);

  // 현재 선택된 기록 정보
  const currentRecord = useMemo(() => {
    if (!currentRecordId) return null;
    return accountRecords.find(r => r.record_id === currentRecordId) || null;
  }, [currentRecordId, accountRecords]);

  // 리밸런싱 기록명 리스트
  const recordNames = useMemo(() => {
    return accountRecords.map(r => ({
      record_id: r.record_id,
      record_name: r.record_name || `기록 ${r.record_id}`,
      record_date: r.record_date,
    }));
  }, [accountRecords, selectedAccountIndex]);

  // 1. value만 먼저 계산 (rebalanceAmount 없이)
  const cashItemsBase = useMemo(() => {
    const baseItems = recordRuds
      .filter(rud => rud.stock_region === 0)
      .map(rud => ({
        name: rud.stock_name,
        value: rud.dollar || (rud.won ? rud.won / currentExchangeRate : 0),
        krwValue: rud.won || (rud.dollar ? rud.dollar * currentExchangeRate : 0),
        targetPortion: rud.expert_per,
      }));

    // 실시간 원화 현금이 있으면 교체
    if (realtimeBalance && realtimeBalance.krwCash > 0) {
      const krwIndex = baseItems.findIndex(item => item.name === '원화');
      if (krwIndex !== -1) {
        // 기존 원화 항목을 실시간 데이터로 교체
        baseItems[krwIndex] = {
          ...baseItems[krwIndex],
          value: realtimeBalance.krwCash / currentExchangeRate, // 달러로 환산
          krwValue: realtimeBalance.krwCash
        };
        console.log('[현금 계산] 실시간 원화 현금 적용:', {
          krwCash: realtimeBalance.krwCash,
          dollarValue: realtimeBalance.krwCash / currentExchangeRate
        });
      }
    }

    return baseItems;
  }, [recordRuds, currentExchangeRate, realtimeBalance]);

  const foreignStocksBase = useMemo(() => {
    return recordRuds
      .filter(rud => rud.stock_region === 2)
      .map(rud => ({
        name: rud.stock_name,
        ticker: rud.nos ? `${rud.nos}주` : '',
        value: rud.dollar || 0,
        krwValue: (rud.dollar || 0) * currentExchangeRate,
        percentChange: rud.rate || 0,
        targetPortion: rud.expert_per,
        market_order: rud.market_order
      }));
  }, [recordRuds, currentExchangeRate]);

  const domesticStocksBase = useMemo(() => {
    return recordRuds
      .filter(rud => rud.stock_region === 1)
      .map(rud => ({
        name: rud.stock_name,
        ticker: rud.nos ? `${rud.nos}주` : '',
        value: (rud.won || 0) / currentExchangeRate,
        krwValue: rud.won || 0,
        percentChange: rud.rate || 0,
        targetPortion: rud.expert_per,
        market_order: rud.market_order
      }));
  }, [recordRuds, currentExchangeRate]);

  // 2. totalBalance 계산
  const totalBalance = useMemo(() => {
    return (
      cashItemsBase.reduce((sum, item) => sum + item.value, 0) +
      foreignStocksBase.reduce((sum, item) => sum + item.value, 0) +
      domesticStocksBase.reduce((sum, item) => sum + item.value, 0)
    );
  }, [cashItemsBase, foreignStocksBase, domesticStocksBase]);

  // 3. rebalanceAmount를 포함한 최종 리스트 생성
  const getCashItems = useMemo((): CashItem[] => {
    return cashItemsBase.map(item => ({
      ...item,
      rebalanceAmount: (totalBalance * (item.targetPortion / 100)) - item.value,
    }));
  }, [cashItemsBase, totalBalance]);

  const getForeignStocks = useMemo((): StockItem[] => {
    return foreignStocksBase.map(item => {
      const rebalanceAmount = (totalBalance * (item.targetPortion / 100)) - item.value;
      
      // 실시간 주식 가격 정보 가져오기
      const currentPrice = realtimeBalance?.stockPrices?.[item.name];
      let requiredShares = 0;
      
      if (currentPrice && currentPrice > 0) {
        // 조정금액을 주식 가격으로 나누어 필요한 주식 수 계산 (달러 기준)
        requiredShares = rebalanceAmount / currentExchangeRate / currentPrice;
      }
      
      return {
        ...item,
        rebalanceAmount,
        currentPrice,
        requiredShares
      };
    });
  }, [foreignStocksBase, totalBalance, realtimeBalance, currentExchangeRate]);

  const getDomesticStocks = useMemo((): StockItem[] => {
    return domesticStocksBase.map(item => {
      const rebalanceAmount = (totalBalance * (item.targetPortion / 100)) - item.value;
      
      // 실시간 주식 가격 정보 가져오기 (국내주식은 원화)
      const currentPrice = realtimeBalance?.stockPrices?.[item.name];
      let requiredShares = 0;
      
      if (currentPrice && currentPrice > 0) {
        // 조정금액을 주식 가격으로 나누어 필요한 주식 수 계산 (원화 기준)
        requiredShares = (rebalanceAmount * currentExchangeRate) / currentPrice;
        
        console.log(`[국내주식 계산] ${item.name}:`, {
          rebalanceAmount,
          rebalanceAmountKRW: rebalanceAmount * currentExchangeRate,
          currentPrice: currentPrice,
          requiredShares: requiredShares.toFixed(2)
        });
      } else {
        console.log(`[국내주식] ${item.name}: 실시간 가격 정보 없음`);
      }
      
      return {
        ...item,
        rebalanceAmount,
        currentPrice,
        requiredShares
      };
    });
  }, [domesticStocksBase, totalBalance, realtimeBalance, currentExchangeRate]);

  // 총 현금 금액
  const totalCash = useMemo(() => {
    return getCashItems.reduce((sum, item) => sum + item.value, 0);
  }, [getCashItems]);

  // 총 해외주식 금액
  const totalForeign = useMemo(() => {
    return getForeignStocks.reduce((sum, item) => sum + item.value, 0);
  }, [getForeignStocks]);

  // 총 국내주식 금액
  const totalDomestic = useMemo(() => {
    return getDomesticStocks.reduce((sum, item) => sum + item.value, 0);
  }, [getDomesticStocks]);

  // 계좌 정보 (dummyAccounts와 stockAccounts에서 선택된 계좌 사용)
  const accountInfo: AccountInfo = useMemo(() => {
    // API 계좌인 경우
    if (stockAccounts.length > 0 && selectedAccountIndex < stockAccounts.length) {
      const apiAccount = stockAccounts[selectedAccountIndex];
      
      // 원금은 백엔드 API의 principal 값만 사용 (0도 정상)
      const principal = apiAccount.principal || 0;
      
      // 실시간 잔고 = 현재 달러 현금 + 원화 현금 + 국내 주식 + 해외 주식 자산 합
      const realtimeBalanceValue = totalCash + totalForeign + totalDomestic; // 달러 기준
      
      // 총 수익 = 실시간 잔고 - 원금 (달러 기준으로 통일)
      const principalInDollar = principal / currentExchangeRate;
      const totalProfit = realtimeBalanceValue - principalInDollar;
      const totalProfitPercent = principalInDollar > 0 ? (totalProfit / principalInDollar) * 100 : 0;
      
      // 일간 손익은 기존 로직 유지 (더미 데이터)
      const prePrincipal = 4800000; // 기본값
      const prePrincipalInDollars = prePrincipal / currentExchangeRate;
      const dailyProfit = realtimeBalanceValue - prePrincipalInDollars;
      const dailyProfitPercent = prePrincipalInDollars > 0 ? (dailyProfit / prePrincipalInDollars) * 100 : 0;
      
      console.log('[계좌 정보 계산]', {
        principal,
        principalInDollar,
        realtimeBalanceValue,
        totalProfit,
        totalProfitPercent: totalProfitPercent.toFixed(1),
        totalCash,
        totalForeign,
        totalDomestic
      });
      
      return {
        name: apiAccount.company,
        number: apiAccount.accountNumber.slice(-4), // 계좌번호 마지막 4자리
        principal: principal,
        valuation: realtimeBalanceValue,
        dailyProfit: dailyProfit,
        dailyProfitPercent: parseFloat(dailyProfitPercent.toFixed(1)),
        totalProfit: totalProfit,
        totalProfitPercent: parseFloat(totalProfitPercent.toFixed(1))
      };
    }
    
    // 더미 계좌인 경우 (기존 로직 유지)
    const dummyAccountIndex = stockAccounts.length > 0 ? 
      selectedAccountIndex - stockAccounts.length : selectedAccountIndex;
    const account = dummyAccounts[dummyAccountIndex >= 0 ? dummyAccountIndex : 0] as DummyAccount;

    // 총 자산 가치 계산
    const totalValue = currentRecordId ? calculateRecordValue(currentRecordId) : 0;

    // 원금 대비 손익 계산
    const dollarPrincipal = account.principal / currentExchangeRate;
    const profit = totalValue - dollarPrincipal;
    const profitPercent = (profit / dollarPrincipal) * 100;

    // 일간 손익 계산 (전날 잔고 기준)
    const prePrincipalInDollars = account.pre_principal / currentExchangeRate;
    const dailyProfit = totalValue - prePrincipalInDollars;
    const dailyProfitPercent = (dailyProfit / prePrincipalInDollars) * 100;

    return {
      name: account.company,
      number: account.account.slice(-4), // 계좌번호 마지막 4자리
      principal: account.principal,
      valuation: totalValue,
      dailyProfit: dailyProfit,
      dailyProfitPercent: parseFloat(dailyProfitPercent.toFixed(1)),
      totalProfit: profit,
      totalProfitPercent: parseFloat(profitPercent.toFixed(1))
    };
  }, [selectedAccountIndex, currentRecordId, currentExchangeRate, stockAccounts, totalCash, totalForeign, totalDomestic, realtimeBalance]);

  // 현재 비중 동적 계산을 위한 함수
  const calculateCurrentPortion = (amount: number): number => {
    if (totalBalance === 0) return 0;
    return parseFloat(((amount / totalBalance) * 100).toFixed(1));
  };

  // 통화 전환 버튼 클릭 핸들러
  const handleCurrencyChange = (type: 'dollar' | 'won') => {
    setCurrencyType(type);
  };

  // 스타일 적용용 함수
  const getProfitStyle = (value: number) =>
    value >= 0 ? styles.profitPositive : styles.profitNegative;

  // 수익 표시 포맷 함수
  const formatProfit = (value: number, type: 'won' | 'dollar') => {
    const sign = value > 0 ? '+' : value < 0 ? '-' : '';
    if (type === 'won') {
      return `${sign}${Math.abs(Math.round(value * currentExchangeRate)).toLocaleString()}원`;
    }
    return `${sign}$${Math.abs(value).toFixed(2)}`;
  };

  // 포커스, 블러 상태 관리
  const componentIsFocused = useRef(true);
  
  // 앱이 활성화되거나 화면이 다시 포커스 받을 때 스크롤 위치 조정 및 데이터 새로고침
  useEffect(() => {
    // 포커스 핸들러 - 포트폴리오 에디터에서 돌아올 때 데이터 새로고침
    const handleFocus = () => {
      componentIsFocused.current = true;
      
      console.log('[리밸런싱] 화면 포커스 받음 - 데이터 새로고침 시작');
      
      // 포커스 받을 때 스크롤 위치 재조정
      setTimeout(() => {
        if (componentIsFocused.current) {
          adjustScrollPosition();
        }
      }, 100);
      
      // 현재 선택된 계좌의 리밸런싱 기록 새로고침
      if (stockAccounts.length > 0 && selectedAccountIndex < stockAccounts.length) {
        const currentAccount = stockAccounts[selectedAccountIndex];
        console.log('[리밸런싱] 계좌 기록 새로고침:', currentAccount.accountNumber);
        loadRebalancingRecords(currentAccount.accountNumber);
      }
    };
    
    // 블러 핸들러
    const handleBlur = () => {
      componentIsFocused.current = false;
      console.log('[리밸런싱] 화면 포커스 잃음');
    };
    
    // React Navigation의 포커스/블러 이벤트 리스너 추가
    const unsubscribeFocus = nav.addListener('focus', handleFocus);
    const unsubscribeBlur = nav.addListener('blur', handleBlur);
    
    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [stockAccounts, selectedAccountIndex]);
  
  // 포트폴리오 불러오기 핸들러
  const handleLoadPortfolio = () => {
    console.log('[리밸런싱] 새 포트폴리오 생성으로 이동');
    
    // 현재 선택된 계좌 정보 추가
    const currentAccount = stockAccounts[selectedAccountIndex];
    if (currentAccount) {
      nav.navigate('PortfolioEditor', {
        selectedAccountNumber: currentAccount.accountNumber,
        selectedAccountCompany: currentAccount.company
      });
    } else {
      nav.navigate('PortfolioEditor');
    }
    setShowLoadPortfolioModal(false);
  };

  // 종목 평균 변화율 계산
  const getForeignPercentChange = useMemo(() => {
    if (getForeignStocks.length === 0) return 0;
    const totalPercentChange = getForeignStocks.reduce((sum, stock) => sum + stock.percentChange, 0);
    return parseFloat((totalPercentChange / getForeignStocks.length).toFixed(1));
  }, [getForeignStocks]);

  const getDomesticPercentChange = useMemo(() => {
    if (getDomesticStocks.length === 0) return 0;
    const totalPercentChange = getDomesticStocks.reduce((sum, stock) => sum + stock.percentChange, 0);
    return parseFloat((totalPercentChange / getDomesticStocks.length).toFixed(1));
  }, [getDomesticStocks]);

  const { name, number, principal, valuation, dailyProfit, dailyProfitPercent, totalProfit, totalProfitPercent } = accountInfo;

  // 화면 회전 핸들러
  const handleRotateScreen = () => {
    // 화면 회전 기능 구현 (향후 구현)
    Alert.alert('알림', '화면 회전 기능은 준비 중입니다.');
  };

  // 포트폴리오 불러오기 모달 상태
  const [showLoadPortfolioModal, setShowLoadPortfolioModal] = useState(false);

  // 현재 선택된 계좌 표시 텍스트 생성
  const getSelectedAccountLabel = () => {
    if (stockAccounts.length > 0 && selectedAccountIndex < stockAccounts.length) {
      // API 계좌 선택된 경우
      const apiAccount = stockAccounts[selectedAccountIndex];
      const secFirm = findSecuritiesFirmByName(apiAccount.company);
      const displayName = secFirm?.shortName || apiAccount.company;
      return `${displayName} (${apiAccount.accountNumber.slice(-4)})`;
          } else {
      // 더미 계좌 선택된 경우
      const dummyAccountIndex = stockAccounts.length > 0 ? 
        selectedAccountIndex - stockAccounts.length : selectedAccountIndex;
      const account = dummyAccounts[dummyAccountIndex >= 0 ? dummyAccountIndex : 0] as DummyAccount;
      const secFirm = findSecuritiesFirmByName(account.company);
      const displayName = secFirm?.shortName || account.company;
      return `${displayName} (${account.account.slice(-4)})`;
    }
  };

  // 스와이프 종료 후 핸들러
  const handleScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    // 카드 너비와 패딩을 고려한 페이지 계산
    const newIndex = Math.round(contentOffsetX / screenWidth);
    
    // 현재 페이지 인덱스 업데이트
    setCurrentPageIndex(newIndex);
    
    // 맨 오른쪽(포트폴리오 추가 카드)인 경우
    const totalPages = recordNames.length > 0 ? recordNames.length + 1 : 2; // +1은 추가 카드
    if (newIndex === totalPages - 1) {
      // 포트폴리오 추가 모달 표시
      setShowLoadPortfolioModal(true);
      // 스크롤 위치를 다시 왼쪽으로 복원
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ 
          x: 0,
          animated: true 
        });
        setCurrentPageIndex(0);
        setCurrentRecordIndex(recordNames.length > 0 ? 0 : -1);
      }, 300);
      return;
    }
    
    // 기록이 없는 경우 특별 처리
    if (recordNames.length === 0) {
      setCurrentRecordIndex(-1);
      return;
    }
    
    // 실제 기록 인덱스 계산
    if (newIndex >= 0 && newIndex < recordNames.length) {
      setCurrentRecordIndex(newIndex);
      // 기록 ID 업데이트
      const record_id = recordNames[newIndex]?.record_id;
      if (record_id) {
        setSelectedRecordId(record_id);
      }
    }
  };

  // 리밸런싱 기록 수정 버튼 핸들러
  const handleEditRecord = () => {
    if (currentRecord && recordDetails) {
      // 포트폴리오 구성 정보 변환
      const portfolioComposition = recordDetails.map(detail => ({
        name: detail.stock_name,
        targetPortion: detail.expert_per,
        stockRegion: detail.stock_region,
        marketTypeName: detail.market_type_name,
        currentShares: detail.nos || 0,
        currentValue: detail.stock_region === 0 ? detail.dollar : 
                     detail.stock_region === 1 ? detail.won : detail.dollar,
        rate: detail.rate || 0
      }));

      // 현재 선택된 계좌 정보 추가
      const currentAccount = stockAccounts[selectedAccountIndex];

      // 포트폴리오 에디터로 전달할 데이터
      const portfolioData = {
        portfolioId: currentRecord.record_id,
        portfolioName: currentRecord.record_name || `기록 ${currentRecord.record_id}`,
        portfolioMemo: currentRecord.memo || '',
        totalBalance: currentRecord.total_balance || totalBalance,
        accountNumber: currentRecord.account,
        recordDate: currentRecord.record_date,
        profitRate: currentRecord.profit_rate || 0,
        composition: portfolioComposition,
        selectedAccountNumber: currentAccount?.accountNumber,
        selectedAccountCompany: currentAccount?.company
      };

      console.log('[포트폴리오 수정] 전달할 데이터:', {
        portfolioId: portfolioData.portfolioId,
        portfolioName: portfolioData.portfolioName,
        portfolioMemo: portfolioData.portfolioMemo,
        compositionLength: portfolioData.composition.length,
        selectedAccountNumber: portfolioData.selectedAccountNumber
      });

      nav.navigate('PortfolioEditor', portfolioData);
    } else {
      Alert.alert('알림', '수정할 리밸런싱 기록이 없거나 데이터를 불러오는 중입니다.');
    }
  };

  // 스크롤 위치 조정을 위한 함수 (반복 사용 위해 추출)
  const adjustScrollPosition = () => {
    console.log('스크롤 위치 조정 - 맨 처음으로 이동');
    requestAnimationFrame(() => {
      // 맨 왼쪽(첫 번째 기록 또는 '기록 없음' 카드)으로 스크롤
      scrollViewRef.current?.scrollTo({ x: 0, animated: false });
      setCurrentPageIndex(0);
      setCurrentRecordIndex(0);
    });
  };

  // 포트폴리오 분석 실행
  const handleAnalyzePortfolio = async () => {
    if (!currentRecord || recordDetails.length === 0) {
      setAnalysisError('분석할 포트폴리오 데이터가 없습니다.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(undefined);

    try {
      console.log('[포트폴리오 분석] 분석 시작');

      // 주식 종목만 필터링 (현금 제외, stock_region이 1 또는 2인 것만)
      const stockRecords = recordDetails.filter(record => 
        record.stock_region === 1 || record.stock_region === 2
      );

      if (stockRecords.length === 0) {
        setAnalysisError('분석할 주식 종목이 없습니다.');
        return;
      }

      // 주식명을 코드로 변환
      const portfolioStocks = stockRecords.map(record => {
        const stockCode = getStockCodeFromName(record.stock_name);
        console.log(`[주식 코드 변환] ${record.stock_name} -> ${stockCode}`);
        return stockCode;
      });

      // 목표 비중 (expert_per) 사용
      const rawWeights = stockRecords.map(record => record.expert_per);

      console.log('[포트폴리오 분석] API 요청 데이터:', {
        portfolioStocks,
        rawWeights,
        totalStocks: portfolioStocks.length
      });

      // API 호출
      const result = await analyzePortfolio({
        portfolio_stocks: portfolioStocks,
        raw_weights: rawWeights
      });

      if (result.success && result.data) {
        console.log('[포트폴리오 분석] 분석 성공:', result.data);
        setAnalysisResult(result.data);
        setAnalysisError(undefined);
      } else {
        console.error('[포트폴리오 분석] 분석 실패:', result.error);
        setAnalysisError(result.error || '분석 중 오류가 발생했습니다.');
      }

    } catch (error) {
      console.error('[포트폴리오 분석] 예상치 못한 오류:', error);
      setAnalysisError('분석 중 예상치 못한 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 초기 데이터 로딩 (MyStockAccountComponent 방식)
  useEffect(() => {
    // 연결된 계좌 ID 정보 가져오기
    const getConnectedAccounts = async () => {
      try {
        // API에서 자체적으로 토큰을 가져오기 때문에 토큰을 전달할 필요가 없음
        const accounts = await fetchConnectedAccounts();
        
        console.log('Connected Accounts:', accounts);
        setConnectedAccounts(accounts);
        
        // 계좌 정보 조회도 같이 실행
        getStockAccounts(accounts);
      } catch (error) {
        console.error('계좌 연결 ID 조회 실패:', error);
      }
    };

    // 증권 계좌 정보 가져오기
    const getStockAccounts = async (connectedAccountsList: any[]) => {
      try {
        if (!loggedToken) {
          console.log('토큰 없음');
          return;
        }

        const stockAccountsResult = await fetchStockAccounts(loggedToken);
        
        console.log('=== 리밸런싱 페이지 계좌 API 응답 상세 로깅 ===');
        console.log('API 성공 여부:', stockAccountsResult.success);
        console.log('원본 응답 데이터:', JSON.stringify(stockAccountsResult.data, null, 2));
        
        if (stockAccountsResult.success && stockAccountsResult.data) {
          // 각 계좌별로 principal 값 확인
          stockAccountsResult.data.forEach((account: any, index: number) => {
            console.log(`계좌 ${index + 1}:`, {
              company: account.company,
              accountNumber: account.accountNumber,
              principal: account.principal,
              principalType: typeof account.principal,
              returnRate: account.returnRate
            });
          });
          
          setStockAccounts(stockAccountsResult.data);
        } else {
          console.error('계좌 정보 조회 실패');
        }
      } catch (error) {
        console.error('증권 계좌 정보 조회 실패:', error);
      }
    };

    getConnectedAccounts();
    
    return () => {
      console.log('컴포넌트 언마운트');
    };
  }, [loggedToken]);
  
  // 계좌 정보 로드 완료 후 모든 계좌 비밀번호 상태 확인
  useEffect(() => {
    const loadAllAccountPasswords = async () => {
      if (stockAccounts.length > 0 && connectedAccounts.length > 0) {
        console.log('모든 계좌 데이터 로드 완료, 비밀번호 상태 확인 시작');
        
        const passwordStatusUpdates: {[key: string]: boolean} = {};
        
        for (let i = 0; i < stockAccounts.length; i++) {
          const account = stockAccounts[i];
          const organizationCode = getOrganizationCode(account.company);
          
          // 저장된 비밀번호가 있는지 확인
          const hasPassword = await checkSavedPassword(account.accountNumber, organizationCode);
          passwordStatusUpdates[account.accountNumber] = hasPassword;
          
          if (hasPassword && i === 0) {
            // 첫 번째 계좌에 저장된 비밀번호가 있으면 자동 조회
            console.log(`계좌 ${account.accountNumber}: 저장된 비밀번호로 자동 조회`);
            
            // 유연한 계좌번호 매칭으로 connectedId 찾기
            const connectedId = findConnectedIdByAccount(account.accountNumber);
            
            if (connectedId) {
              setSelectedAccountForPassword({account, connectedId});
              setSelectedAccountIndex(i);
              
              // 리밸런싱 기록 자동 조회
              await loadRebalancingRecords(account.accountNumber);
    } else {
              console.error(`계좌 ${account.accountNumber}에 매칭되는 connectedId를 찾을 수 없음`);
            }
          } else if (!hasPassword && i === 0) {
            // 첫 번째 계좌에 저장된 비밀번호가 없으면 모달 표시
            console.log(`계좌 ${account.accountNumber}: 저장된 비밀번호 없음, 모달 표시`);
            
            // 유연한 계좌번호 매칭으로 connectedId 찾기
            const connectedId = findConnectedIdByAccount(account.accountNumber);
            
            if (connectedId) {
              setSelectedAccountForPassword({account, connectedId});
              setSelectedAccountIndex(i);
              setAccountPassword('');
              setPasswordError('');
              
              setTimeout(() => {
                setShowAccountPasswordModal(true);
              }, 800);
            } else {
              console.error(`계좌 ${account.accountNumber}에 매칭되는 connectedId를 찾을 수 없음`);
            }
          }
        }
        
        // 모든 계좌의 비밀번호 상태 업데이트
        setAccountPasswordStatus(passwordStatusUpdates);
      }
    };

    loadAllAccountPasswords();
  }, [stockAccounts, connectedAccounts, savedAccounts]);

  // 실시간 계좌 잔고 조회 함수 추가
  const loadRealtimeAccountBalance = async (accountNumber: string) => {
    if (!loggedToken) {
      console.log('실시간 잔고 조회 중단: 토큰 없음');
      return;
    }

    setIsLoadingRealtimeBalance(true);
    try {
      const account = stockAccounts.find(acc => acc.accountNumber === accountNumber);
      if (!account) {
        console.error('계좌 정보를 찾을 수 없음:', accountNumber);
        return;
      }

      const connectedId = findConnectedIdByAccount(accountNumber);
      if (!connectedId) {
        console.error('connectedId를 찾을 수 없음:', accountNumber);
        return;
      }

      const organization = getOrganizationCode(account.company);
      const savedAccount = findSavedAccount(accountNumber, organization);
      
      let password = '';
      if (savedAccount && savedAccount.account_password) {
        password = savedAccount.account_password;
      } else {
        try {
          const directPassword = await AsyncStorage.getItem(`direct_password_${accountNumber}`);
          password = directPassword || '';
        } catch (err) {
          console.error('직접 저장소에서 비밀번호 가져오기 오류:', err);
        }
      }

      if (!password) {
        console.log('저장된 비밀번호가 없어서 실시간 잔고 조회 불가');
        return;
      }

      console.log('[실시간 잔고] API 호출 시작:', {
        accountNumber,
        organization,
        connectedId
      });

      const response = await getAccountBalance({
        organization,
        connectedId,
        account: accountNumber,
        account_password: password
      });

      if (response.data.result.code === 'CF-00000') {
        const apiData = response.data.data;
        
        console.log('[실시간 잔고] API 응답 원본 데이터:', {
          rsTotAmt: apiData.rsTotAmt,
          rsTotValAmt: apiData.rsTotValAmt,
          resDepositReceivedD2: apiData.resDepositReceivedD2,
          resDepositReceived: apiData.resDepositReceived,
          resItemListLength: (apiData.resItemList || []).length
        });
        
        // 실시간 총 자산 계산 (예수금 + 보유종목)
        let totalAmount = parseFloat(apiData.rsTotAmt || apiData.rsTotValAmt || '0');
        
        // 총평가금액이 0이면 직접 계산
        if (totalAmount === 0) {
          const depositAmount = parseFloat(apiData.resDepositReceivedD2 || apiData.resDepositReceived || '0');
          const stocksValue = (apiData.resItemList || []).reduce((total: number, item: any) => {
            const itemValue = parseFloat(item.resValuationAmt || '0');
            console.log('[실시간 잔고] 종목 평가금액:', {
              name: item.resItemName,
              value: itemValue
            });
            return total + itemValue;
          }, 0);
          totalAmount = depositAmount + stocksValue;
          
          console.log('[실시간 잔고] 직접 계산 결과:', {
            depositAmount,
            stocksValue,
            totalAmount
          });
        }
        
        // 원금은 별도로 관리 (백엔드 API의 principal 값 사용)
        const balanceData = {
          krwCash: parseFloat(apiData.resDepositReceivedD2 || apiData.resDepositReceived || '0'), // 원화 현금
          usdCash: 0, // USD 현금 (필요시 추가)
          totalAmount, // 실시간 총 자산
          // 실시간 주식 가격 정보 저장
          stockPrices: (apiData.resItemList || []).reduce((prices: any, item: any) => {
            const stockName = item.resItemName;
            const currentPrice = parseFloat(item.resPresentAmt || '0');
            const currency = item.resAccountCurrency;
            const nation = item.resNation;
            
            console.log('[주식 가격 수집]', {
              stockName,
              currentPrice,
              currency,
              nation,
              originalPriceField: item.resPresentAmt,
              allFields: Object.keys(item)
            });
            
            if (stockName && currentPrice > 0) {
              prices[stockName] = currentPrice;
              console.log(`[가격 저장] ${stockName}: ${currentPrice} (${currency || 'KRW'})`);
            } else {
              console.log(`[가격 저장 실패] ${stockName}: ${currentPrice}`);
            }
            return prices;
          }, {})
        };

        console.log('[실시간 잔고] 조회 성공:', {
          krwCash: balanceData.krwCash,
          totalAmount: balanceData.totalAmount,
          usdCash: balanceData.usdCash,
          stockPricesCount: Object.keys(balanceData.stockPrices).length
        });
        
        // 실시간 주식 가격 정보 상세 로깅
        if (Object.keys(balanceData.stockPrices).length > 0) {
          console.log('[실시간 주식 가격]:', balanceData.stockPrices);
        }

        setRealtimeBalance(balanceData);
      } else {
        console.error('실시간 잔고 조회 실패:', response.data.result.message);
      }
    } catch (error) {
      console.error('[실시간 잔고] 조회 중 오류:', error);
    } finally {
      setIsLoadingRealtimeBalance(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { flex: 1 }]}
      contentContainerStyle={[styles.contentContainer, { flexGrow: 1 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* 계좌 선택 영역 */}
      <View style={styles.accountSelectorContainer}>
        <AccountSelectorComponent 
          theme={theme}
          accounts={stockAccounts.length > 0 ? stockAccounts : []}
          selectedAccountIndex={selectedAccountIndex < stockAccounts.length ? selectedAccountIndex : 0}
          onAccountChange={handleAccountChange}
          isLoading={isLoading}
        />
        
        {/* 비밀번호 입력 버튼 */}
        {stockAccounts.length > 0 && selectedAccountIndex < stockAccounts.length && 
         !accountPasswordStatus[stockAccounts[selectedAccountIndex]?.accountNumber] && (
          <TouchableOpacity
            style={{marginTop: 8, padding: 8, backgroundColor: theme.colors.primary, borderRadius: 8, alignSelf: 'center'}}
            onPress={() => {
              const account = stockAccounts[selectedAccountIndex];
              
              // 유연한 계좌번호 매칭으로 connectedId 찾기
              const connectedId = findConnectedIdByAccount(account.accountNumber);
              
              if (connectedId) {
                handleAccountPasswordRequired(account, connectedId);
              } else {
                console.log('Available connectedAccounts:', connectedAccounts);
                Alert.alert('오류', '해당 계좌의 연결 정보를 찾을 수 없습니다. 계좌를 다시 등록해주세요.');
              }
            }}
          >
            <Text style={{color: theme.colors.card, fontSize: 12}}>계좌 비밀번호 입력</Text>
          </TouchableOpacity>
        )}
        
        {/* 로딩 상태 표시 */}
        {isLoading ? (
          <Text style={styles.accountText}>증권 계좌 정보를 불러오는 중...</Text>
        ) : isLoadingRecords ? (
          <Text style={styles.accountText}>리밸런싱 기록을 불러오는 중...</Text>
        ) : stockAccounts.length === 0 && loggedToken ? (
          <Text style={styles.accountText}>등록된 증권 계좌가 없습니다</Text>
        ) : null}
      </View>

      {/* 리밸런싱 기록 스와이프 영역 - 계좌 선택 바로 밑으로 이동 */}
      <View style={[styles.recordSwipeContainer, { marginTop: 8, height: 200 }]}>
        {isLoadingRecords ? (
          <View style={[styles.recordItemContainer, styles.card, { justifyContent: 'center', alignItems: 'center', width: screenWidth - 32, marginHorizontal: 16 }]}>
            <Text>리밸런싱 기록을 불러오는 중...</Text>
          </View>
        ) : (
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          decelerationRate="fast"
          snapToAlignment="center"
          snapToInterval={screenWidth}
          contentOffset={{ x: 0, y: 0 }}
        >
          {/* 기록이 없을 때 */}
          {accountRecords.length === 0 ? (
            <View style={[styles.recordItemContainer, styles.card, { width: screenWidth - 32, marginHorizontal: 16 }]}>
              <View style={{alignItems: 'center', justifyContent: 'center'}}>
                <Ionicons name="document-text-outline" size={50} color={theme.colors.textLight} style={{marginBottom: 16}} />
                <Text style={{fontSize: 18, fontWeight: 'bold', color: theme.colors.text, marginBottom: 8}}>
                  기록이 없어요
                </Text>
                <Text style={{textAlign: 'center', color: theme.colors.textLight, lineHeight: 20}}>
                  오른쪽으로 슬라이드해서 기록을 만들어 주세요
                </Text>
              </View>
            </View>
          ) : (
            // 기록 카드들
            accountRecords.map((record, index) => (
              <View key={record.record_id} style={[styles.recordItemContainer, styles.card, { width: screenWidth - 32, marginHorizontal: 16 }]}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={[styles.recordToggleText, {fontSize: 18, fontWeight: '600'}]}>
                      {record.record_name || `기록 ${record.record_id}`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.recordEditButton, {backgroundColor: 'transparent'}]}
                    onPress={handleEditRecord}
                  >
                    <Text style={styles.recordEditText}>수정</Text>
                  </TouchableOpacity>
                </View>
                
                {/* 계좌 정보 영역 */}
                <View style={{marginTop: 5}}>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10}}>
                    <Text style={styles.infoLabel}>원금</Text>
                    <Text style={styles.infoValue}>
                      {currencyType === 'won'
                        ? `${principal.toLocaleString()}원`
                        : `$${(principal / currentExchangeRate).toFixed(2)}`}
                    </Text>
                  </View>
                  
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10}}>
                    <Text style={styles.infoLabel}>실시간 잔고</Text>
                    <Text style={styles.infoValue}>
                      {currencyType === 'won'
                        ? `${Math.round(valuation * currentExchangeRate).toLocaleString()}원`
                        : `$${valuation.toFixed(2)}`}
                    </Text>
                  </View>
                  
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10}}>
                    <Text style={styles.infoLabel}>총 수익</Text>
                    <Text style={[getProfitStyle(totalProfit), {flex: 1, textAlign: 'right', flexWrap: 'wrap'}]}>
                      {formatProfit(totalProfit, currencyType)}({totalProfitPercent.toFixed(1)}%)
                    </Text>
                  </View>
                  
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Text style={styles.infoLabel}>일간 수익</Text>
                    <Text style={[getProfitStyle(dailyProfit), {flex: 1, textAlign: 'right', flexWrap: 'wrap', paddingLeft: 8}]}>
                      {formatProfit(dailyProfit, currencyType)}({dailyProfitPercent.toFixed(1)}%)
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
          
          {/* 포트폴리오 추가 카드 */}
          <View style={[styles.loadPortfolioContainer, styles.card, { backgroundColor: theme.colors.primary, width: screenWidth - 32, marginHorizontal: 16 }]}>
            <Text style={styles.loadPortfolioIcon}>+</Text>
            <Text style={styles.addRecordText}>새 포트폴리오 추가하기</Text>
          </View>
        </ScrollView>
        )}
      </View>

      {/* 페이지 인디케이터 - 기록 카드 바로 아래로 이동 */}
      <View style={[styles.recordPaginationContainer, { marginTop: 8, marginBottom: 16 }]}>
        {accountRecords.length === 0 ? (
            <>
              <View
                style={[
                  styles.paginationDot,
                  currentPageIndex === 0 ? styles.activePaginationDot : null
                ]}
              />
              <View
                style={[
                  styles.paginationDot,
                  currentPageIndex === 1 ? styles.activePaginationDot : null
                ]}
              />
            </>
          ) : (
            <>
            {accountRecords.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    currentPageIndex === index ? styles.activePaginationDot : null
                  ]}
                />
              ))}
              <View
                style={[
                  styles.paginationDot,
                currentPageIndex === accountRecords.length ? styles.activePaginationDot : null
                ]}
              />
            </>
          )}
      </View>

      {/* 나머지 컴포넌트들 */}
      {currentRecord && !isLoadingDetails && (
        <View style={{ marginTop: 0 }}>
          {/* 통화 전환 버튼 */}
          <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10, marginTop: 2, marginRight: 2}}>
            <TouchableOpacity 
              style={styles.rotateButton}
              onPress={handleRotateScreen}
            >
              <Text style={styles.rotateButtonText}>↻</Text>
            </TouchableOpacity>
            
            <CurrencyToggle
              theme={theme}
              currencyType={currencyType}
              onCurrencyChange={setCurrencyType}
            />
          </View>

          {/* 현금 카드 */}
          <RMoneyComponent
            totalAmount={totalCash}
            cashItems={getCashItems}
            currencyType={currencyType}
            exchangeRate={currentExchangeRate}
            totalBalance={totalBalance}
            calculateCurrentPortion={calculateCurrentPortion}
          />

          {/* 해외주식 카드 */}
          <RForeignComponent
            totalAmount={totalForeign}
            percentChange={getForeignPercentChange}
            stocks={getForeignStocks}
            currencyType={currencyType}
            exchangeRate={currentExchangeRate}
            totalBalance={totalBalance}
            calculateCurrentPortion={calculateCurrentPortion}
          />

          {/* 국내주식 카드 */}
          <RDomesticComponent
            totalAmount={totalDomestic}
            percentChange={getDomesticPercentChange}
            stocks={getDomesticStocks}
            currencyType={currencyType}
            exchangeRate={currentExchangeRate}
            totalBalance={totalBalance}
            calculateCurrentPortion={calculateCurrentPortion}
          />

          {/* 포트폴리오 분석 카드 */}
          <RAnalysisComponent
            analysisResult={analysisResult}
            isLoading={isAnalyzing}
            onAnalyze={handleAnalyzePortfolio}
            error={analysisError}
          />
        </View>
      )}

      {/* 포트폴리오 추가 모달 */}
      <AddPortfolioModal
        visible={showLoadPortfolioModal}
        onClose={() => setShowLoadPortfolioModal(false)}
        onConfirm={handleLoadPortfolio}
        theme={theme}
      />

      {/* 계좌 비밀번호 모달 */}
      <AccountPasswordModal
        theme={theme}
        visible={showAccountPasswordModal}
        account={selectedAccountForPassword ? 
          {
            company: selectedAccountForPassword.account.company,
            accountNumber: selectedAccountForPassword.account.accountNumber
          } : null}
        password={accountPassword}
        onChangePassword={(password: string) => setAccountPassword(password)}
        onConfirm={saveAccountPassword}
        onCancel={() => setShowAccountPasswordModal(false)}
        isLoading={saveInProgress}
        errorMessage={passwordError}
      />
    </ScrollView>
  );
};

export default withTheme(RebalancingComponent);