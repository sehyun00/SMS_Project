// 파일 경로: src/components/RebalancingComponent.tsx
// 컴포넌트 흐름: App.js > AppNavigator.js > MainPage.jsx > RebalancingComponent.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, FlatList, Alert, Dimensions, InteractionManager, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MainPageNavigationProp } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { fetchStockAccounts } from '../api/homeApi';
import { findSecuritiesFirmByName } from '../data/organizationData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchConnectedAccounts } from '../api/connectedAccountApi';
import { FLASK_SERVER_URL } from '../constants/config';
import axios from 'axios';
import AccountPasswordModal from './common/AccountPasswordModal';
import { useAccounts } from '../context/AccountsContext';

// 컴포넌트 임포트
import RForeignComponent from './RForeignComponent';
import RDomesticComponent from './RDomesticComponent';
import RMoneyComponent from './RMoneyComponent';

// 더미 데이터 임포트 - 새로운 구조
import {
  dummyAccounts,
  dummyRecords,
  getAccountRecords,
  getRecordRuds,
  calculateRecordValue,
  getCurrentExchangeRate
} from '../data/dummyData';

// 스타일 임포트
import withTheme from '../hoc/withTheme';
import createStyles from '../styles/components/rebalancingComponent.styles';

// 커스텀 훅 임포트
import { useExchangeRate } from '../hooks/useExchangeRate';

// 공통 Theme 타입 가져오기
import { Theme } from '../types/theme';

// 계좌 선택 컴포넌트 임포트
import AccountSelectorComponent from './AccountSelectorComponent';

// API에서 가져오는 계좌 정보 인터페이스
interface ApiAccountInfo {
  company: string;
  accountNumber: string;
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
}

// 컴포넌트 props 인터페이스 정의
interface RebalancingComponentProps {
  theme: Theme;
  navigation?: MainPageNavigationProp;
}

const RebalancingComponent: React.FC<RebalancingComponentProps> = ({ theme, navigation }) => {
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const defaultNavigation = useNavigation<MainPageNavigationProp>();
  const { loggedToken } = useAuth();
  
  // navigation prop이 제공되지 않은 경우 useNavigation 훅 사용
  const nav = navigation || defaultNavigation;
  
  // API에서 가져온 증권 계좌 정보 상태
  const [stockAccounts, setStockAccounts] = useState<ApiAccountInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [accountDropdownVisible, setAccountDropdownVisible] = useState(false);
  
  // connectedId 정보 상태
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  
  // 계좌 비밀번호 모달 상태
  const [showAccountPasswordModal, setShowAccountPasswordModal] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [selectedAccountForPassword, setSelectedAccountForPassword] = useState<{account: ApiAccountInfo, connectedId: string} | null>(null);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  // 계좌 정보 Context 사용
  const { accounts: savedAccounts, addAccount: saveAccount, updateAccount } = useAccounts();
  
  // 화면 너비 구하기
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth - 32; // 카드 너비 (양쪽 16px 패딩 제외)
  const cardTotalWidth = screenWidth; // 스와이프 시 한 번에 이동할 너비

  // 스크롤뷰 참조
  const scrollViewRef = useRef<ScrollView>(null);
  // 현재 스와이프된 기록 인덱스 (페이지 인디케이터용)
  const [currentRecordIndex, setCurrentRecordIndex] = useState(0);
  // 현재 화면에 보이는 페이지 인덱스 (0: 포트폴리오 추가, 1: 기록 또는 기록 없음)
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  // 현재 현금 정보 가져오기
  const { exchangeRate, loading: exchangeRateLoading } = useExchangeRate();
  const currentExchangeRate = exchangeRate || getCurrentExchangeRate();

  // 화폐 단위 상태 (기본값: 달러)
  const [currencyType, setCurrencyType] = useState<'dollar' | 'won'>('dollar');

  // 선택된 계좌 상태 (기본값: 첫 번째 계좌)
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);

  // API에서 ConnectedAccounts 정보 가져오기
  useEffect(() => {
    const getConnectedAccounts = async () => {
      if (!loggedToken) {
        console.log('토큰 없음, Connected Accounts API 호출 안함');
        return;
      }
      
      try {
        setIsLoading(true);
        console.log('Connected Accounts 정보 가져오기 시도...');
        const accounts = await fetchConnectedAccounts();
        
        console.log('Connected Accounts 응답:', accounts);
        setConnectedAccounts(accounts);
        
        // 증권 계좌 정보도 함께 가져오기
        const stockAccountsResult = await fetchStockAccounts(loggedToken);
        if (stockAccountsResult.success && stockAccountsResult.data) {
          console.log('증권 계좌 API 응답:', stockAccountsResult.data);
          setStockAccounts(stockAccountsResult.data);
        } else {
          console.log('증권 계좌 정보 가져오기 실패');
          setStockAccounts([]);
        }
      } catch (error) {
        console.error('Connected Accounts 정보 가져오기 오류:', error);
        setConnectedAccounts([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    getConnectedAccounts();
  }, [loggedToken]);

  // 페이지 진입 시 현재 선택된 계좌의 비밀번호 확인
  useEffect(() => {
    // 디버깅용 로그 추가
    console.log('RebalancingComponent - 계좌 정보:', {
      accountsCount: stockAccounts.length,
      selectedIndex: selectedAccountIndex,
      loading: isLoading
    });
    
    const checkSelectedAccountPassword = async () => {
      // 로딩 중이거나 계좌 정보가 없으면 종료
      if (isLoading || stockAccounts.length === 0 || connectedAccounts.length === 0) {
        console.log('계좌 정보가 아직 로드되지 않았거나 로딩 중입니다.');
        return;
      }
      
      console.log('페이지 진입 - 비밀번호 확인 시작...');
      
      // 현재 선택된 계좌가 API 계좌인 경우만 확인
      if (selectedAccountIndex < stockAccounts.length) {
        const account = stockAccounts[selectedAccountIndex];
        const accountNumber = account.accountNumber;
        
        console.log(`페이지 진입 - 선택된 계좌: ${account.company} (${accountNumber})`);
        
        // 비밀번호 확인
        const hasPassword = await checkAccountPassword(accountNumber);
        
        // 비밀번호 정보 로그
        if (hasPassword) {
          const maskedPassword = await getAccountPassword(accountNumber);
          console.log(`페이지 진입 - 계좌 ${accountNumber}의 비밀번호: ${maskedPassword}`);
        } else {
          console.log(`페이지 진입 - 계좌 ${accountNumber}의 저장된 비밀번호가 없습니다. 모달 표시 필요`);
          
          // connectedId 찾기
          let connectedId = '';
          
          // 인덱스 기반 매핑 시도
          if (connectedAccounts.length > selectedAccountIndex) {
            if (typeof connectedAccounts[selectedAccountIndex] === 'string') {
              connectedId = connectedAccounts[selectedAccountIndex];
            } else if (typeof connectedAccounts[selectedAccountIndex] === 'object' && 
                      connectedAccounts[selectedAccountIndex] !== null) {
              connectedId = connectedAccounts[selectedAccountIndex].connectedId || '';
            }
          }
          
          // 계좌번호 기반 매핑 시도
          if (!connectedId) {
            const foundConnectedId = findConnectedIdByAccountNumber(accountNumber);
            if (foundConnectedId) {
              connectedId = foundConnectedId;
            }
          }
          
          // 그래도 없으면 첫 번째 connectedId 사용
          if (!connectedId && connectedAccounts.length > 0) {
            if (typeof connectedAccounts[0] === 'string') {
              connectedId = connectedAccounts[0];
            } else if (typeof connectedAccounts[0] === 'object' && connectedAccounts[0] !== null) {
              connectedId = connectedAccounts[0].connectedId || '';
            }
          }
          
          // connectedId가 있으면 모달 표시
          if (connectedId) {
            console.log(`페이지 진입 - 계좌 ${accountNumber}에 매핑된 connectedId: ${connectedId}`);
            setSelectedAccountForPassword({account, connectedId});
            setAccountPassword('');
            setPasswordError('');
            
            // setTimeout으로 약간 지연시켜 모달 표시 (UI 렌더링 완료 후)
            setTimeout(() => {
              setShowAccountPasswordModal(true);
            }, 500);
          }
        }
      }
    };
    
    // 계좌 정보와 connectedId 정보가 모두 로드된 후 실행
    if (!isLoading && stockAccounts.length > 0 && connectedAccounts.length > 0) {
      console.log('페이지 진입 - 계좌 정보 로드 완료, 비밀번호 확인 실행');
      checkSelectedAccountPassword();
    }
  }, [stockAccounts, connectedAccounts, isLoading, selectedAccountIndex]);

  // 계좌번호로 해당 계좌의 connectedId 찾기
  const findConnectedIdByAccountNumber = (accountNumber: string): string | undefined => {
    const account = connectedAccounts.find(acc => 
      (typeof acc === 'object' && acc.accountNumber === accountNumber) ||
      (typeof acc === 'string' && acc.includes(accountNumber))
    );
    
    if (!account) return undefined;
    
    return typeof account === 'object' ? account.connectedId : account;
  };

  // 선택된 계좌의 리밸런싱 기록 목록
  const accountRecords = useMemo(() => {
    // 선택된 계좌가 API 계좌인 경우
    if (stockAccounts.length > 0 && selectedAccountIndex < stockAccounts.length) {
      const selectedAccount = stockAccounts[selectedAccountIndex];
      return getAccountRecords(selectedAccount.accountNumber);
    }
    
    // 그 외에는 더미 데이터 사용
    const dummyAccountIndex = stockAccounts.length > 0 ? 
      selectedAccountIndex - stockAccounts.length : selectedAccountIndex;
    const account = dummyAccounts[dummyAccountIndex >= 0 ? dummyAccountIndex : 0];
    return getAccountRecords(account.account);
  }, [selectedAccountIndex, stockAccounts]);

  // 리밸런싱 기록 토글(드롭다운) 상태
  const [recordDropdownVisible, setRecordDropdownVisible] = useState(false);

  // 선택된 리밸런싱 기록 ID (기본값: 가장 최근 기록)
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

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

  // 선택된 리밸런싱 기록 상세 데이터 가져오기
  const recordRuds = useMemo(() => {
    if (currentRecordId === null) return [];
    return getRecordRuds(currentRecordId);
  }, [currentRecordId]);

  // 1. value만 먼저 계산 (rebalanceAmount 없이)
  const cashItemsBase = useMemo(() => {
    return recordRuds
      .filter(rud => rud.stock_region === 0)
      .map(rud => ({
        name: rud.stock_name,
        value: rud.dollar || (rud.won ? rud.won / currentExchangeRate : 0),
        krwValue: rud.won || (rud.dollar ? rud.dollar * currentExchangeRate : 0),
        targetPortion: rud.expert_per,
      }));
  }, [recordRuds, currentExchangeRate]);

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
    return foreignStocksBase.map(item => ({
      ...item,
      rebalanceAmount: (totalBalance * (item.targetPortion / 100)) - item.value,
    }));
  }, [foreignStocksBase, totalBalance]);

  const getDomesticStocks = useMemo((): StockItem[] => {
    return domesticStocksBase.map(item => ({
      ...item,
      rebalanceAmount: (totalBalance * (item.targetPortion / 100)) - item.value,
    }));
  }, [domesticStocksBase, totalBalance]);

  // 계좌 정보 (dummyAccounts와 stockAccounts에서 선택된 계좌 사용)
  const accountInfo: AccountInfo = useMemo(() => {
    // API 계좌인 경우
    if (stockAccounts.length > 0 && selectedAccountIndex < stockAccounts.length) {
      const apiAccount = stockAccounts[selectedAccountIndex];
      
      // API 계좌는 principal, pre_principal 값이 없을 수 있으므로 기본값 설정
      const principal = 5000000; // 기본값
      const prePrincipal = 4800000; // 기본값
      
      // 주식 잔액은 현재 API로 가져올 수 없으므로 더미 데이터 사용
      const totalValue = currentRecordId ? calculateRecordValue(currentRecordId) : 5323773;
      
      // 원금 대비 손익 계산
      const dollarPrincipal = principal / currentExchangeRate;
      const profit = totalValue - dollarPrincipal;
      const profitPercent = (profit / dollarPrincipal) * 100;
      
      // 일간 손익 계산 (전날 잔고 기준)
      const prePrincipalInDollars = prePrincipal / currentExchangeRate;
      const dailyProfit = totalValue - prePrincipalInDollars;
      const dailyProfitPercent = (dailyProfit / prePrincipalInDollars) * 100;
      
      return {
        name: apiAccount.company,
        number: apiAccount.accountNumber.slice(-4), // 계좌번호 마지막 4자리
        principal: principal,
        valuation: totalValue,
        dailyProfit: dailyProfit,
        dailyProfitPercent: parseFloat(dailyProfitPercent.toFixed(1)),
        totalProfit: profit,
        totalProfitPercent: parseFloat(profitPercent.toFixed(1))
      };
    }
    
    // 더미 계좌인 경우 (기존 로직 유지)
    const dummyAccountIndex = stockAccounts.length > 0 ? 
      selectedAccountIndex - stockAccounts.length : selectedAccountIndex;
    const account = dummyAccounts[dummyAccountIndex >= 0 ? dummyAccountIndex : 0];

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
  }, [selectedAccountIndex, currentRecordId, currentExchangeRate, stockAccounts]);

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

  // 포커스, 블러 상태 관리
  const componentIsFocused = useRef(true);
  
  // 앱이 활성화되거나 화면이 다시 포커스 받을 때 스크롤 위치 조정
  useEffect(() => {
    // 포커스 핸들러
    const handleFocus = () => {
      componentIsFocused.current = true;
      
      // 포커스 받을 때 스크롤 위치 재조정
      setTimeout(() => {
        if (componentIsFocused.current) {
          adjustScrollPosition();
        }
      }, 100);
    };
    
    // 블러 핸들러
    const handleBlur = () => {
      componentIsFocused.current = false;
    };
    
    // 이벤트 리스너 추가 (실제 앱에서는 React Navigation의 이벤트 사용)
    // 임시 구현 - 이벤트가 있을 때만 사용
    /*
    navigation.addListener('focus', handleFocus);
    navigation.addListener('blur', handleBlur);
    
    return () => {
      navigation.removeListener('focus', handleFocus);
      navigation.removeListener('blur', handleBlur);
    };
    */
    
    // 초기 실행
    handleFocus();
  }, []);
  
  // 로컬 스토리지에서 계좌 비밀번호 확인
  const checkAccountPassword = async (accountNumber: string) => {
    try {
      // 1. AccountsContext에서 계좌 정보 찾기
      const organizationCode = getOrganizationCode(stockAccounts.find(acc => acc.accountNumber === accountNumber)?.company || '');
      const savedAccount = findSavedAccount(accountNumber, organizationCode);
      
      // 2. 직접 AsyncStorage에서도 확인
      const directPassword = await AsyncStorage.getItem(`direct_password_${accountNumber}`);
      
      // 둘 중 하나라도 비밀번호가 있으면 true 반환
      const hasContextPassword = !!(savedAccount && savedAccount.account_password);
      const hasDirectPassword = !!directPassword;
      
      console.log(`계좌 ${accountNumber} 비밀번호 확인 결과: Context=${hasContextPassword}, Direct=${hasDirectPassword}`);
      
      return hasContextPassword || hasDirectPassword;
    } catch (error) {
      console.error('비밀번호 확인 오류:', error);
      return false;
    }
  };

  // 로컬 스토리지에서 계좌 비밀번호 가져오기 (마스킹된 형태로)
  const getAccountPassword = async (accountNumber: string) => {
    try {
      // 1. AccountsContext에서 계좌 정보 찾기
      const organizationCode = getOrganizationCode(stockAccounts.find(acc => acc.accountNumber === accountNumber)?.company || '');
      const savedAccount = findSavedAccount(accountNumber, organizationCode);
      let storedPassword = savedAccount?.account_password;
      
      // 2. 직접 AsyncStorage에서도 확인
      if (!storedPassword) {
        storedPassword = await AsyncStorage.getItem(`direct_password_${accountNumber}`);
      }
      
      if (storedPassword) {
        // 비밀번호의 앞 2자리와 나머지는 '*'로 마스킹
        const maskedPassword = storedPassword.length > 2 
          ? storedPassword.substring(0, 2) + '*'.repeat(storedPassword.length - 2)
          : '*'.repeat(storedPassword.length);
        return maskedPassword;
      }
      return null;
    } catch (error) {
      console.error('비밀번호 조회 오류:', error);
      return null;
    }
  };

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

  // 계좌 비밀번호 저장
  const saveAccountPassword = async () => {
    if (!selectedAccountForPassword || !accountPassword) {
      Alert.alert('알림', '계좌 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setSaveInProgress(true);
      setPasswordError('');
      
      // 증권사 코드 찾기
      const firmInfo = findSecuritiesFirmByName(selectedAccountForPassword.account.company);
      if (!firmInfo) {
        throw new Error(`증권사 ${selectedAccountForPassword.account.company}에 대한 코드를 찾을 수 없습니다.`);
      }
      
      const organization = firmInfo.code;
      const accountNumber = selectedAccountForPassword.account.accountNumber;
      const connectedId = selectedAccountForPassword.connectedId;
      
      // 계좌 잔고 조회 시도 (비밀번호 확인)
      console.log('계좌 비밀번호 확인 시도:', {
        connectedId,
        organization,
        account: accountNumber,
        account_password: '******' // 보안을 위해 마스킹
      });
      
      try {
        // Flask API 호출
        const response = await axios.post(`${FLASK_SERVER_URL}/stock/balance`, {
          connectedId,
          organization,
          account: accountNumber,
          account_password: accountPassword
        }, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        // 응답 확인
        if (response.data.result.code === 'CF-00000') {
          console.log('계좌 비밀번호 확인 성공');
          
          // 계좌 정보 생성
          const accountInfo = {
            account: accountNumber,
            account_password: accountPassword,
            connectedId: connectedId,
            organization: organization
          };
          
          // 이미 저장된 계좌인지 확인
          const existingAccount = findSavedAccount(accountNumber, organization);
          
          // 계좌 정보 저장 (비밀번호 포함) - 기존 계좌면 update, 없으면 add
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
          
          // 확인을 위해 저장 후 계좌 정보 다시 조회
          const savedAgain = findSavedAccount(accountNumber, organization);
          console.log(`계좌 ${accountNumber}의 비밀번호 저장 확인:`, savedAgain ? '성공' : '실패');
          
          if (savedAgain && savedAgain.account_password) {
            console.log(`계좌 ${accountNumber}의 비밀번호 저장 완료: ${accountPassword.substring(0, 2)}${'*'.repeat(accountPassword.length - 2)}`);
            
            // 추가로 AsyncStorage에 직접 저장 (이중 보장)
            try {
              await AsyncStorage.setItem(`direct_password_${accountNumber}`, accountPassword);
              console.log(`계좌 ${accountNumber}의 비밀번호 직접 저장 완료`);
            } catch (err) {
              console.error('직접 저장 오류:', err);
            }
            
            // 모달 닫기 전 성공 메시지
            Alert.alert('성공', '계좌 비밀번호가 저장되었습니다.', [
              { text: '확인', onPress: () => {
                setShowAccountPasswordModal(false);
                setAccountPassword('');
                setSelectedAccountForPassword(null);
                setPasswordError('');
              }}
            ]);
          } else {
            throw new Error('계좌 비밀번호가 저장되지 않았습니다. 다시 시도해주세요.');
          }
        } else {
          throw new Error(response.data.result.message || '계좌 잔고 조회 실패');
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

  // 계좌 선택 핸들러 - 수정
  const handleAccountChange = async (index: number) => {
    console.log('계좌 변경:', index);
    setSelectedAccountIndex(index);
    setSelectedRecordId(null); // 계좌 변경 시 리밸런싱 기록 선택 초기화
    
    // API 계좌인 경우 비밀번호 확인
    if (stockAccounts.length > 0 && index < stockAccounts.length) {
      const account = stockAccounts[index];
      const accountNumber = account.accountNumber;
      
      // 로컬 스토리지에서 계좌 비밀번호 확인
      const hasPassword = await checkAccountPassword(accountNumber);
      
      // 비밀번호 정보 로그 출력
      if (hasPassword) {
        const maskedPassword = await getAccountPassword(accountNumber);
        console.log(`계좌 ${accountNumber}의 비밀번호: ${maskedPassword}`);
      } else {
        console.log(`계좌 ${accountNumber}의 저장된 비밀번호가 없습니다.`);
      }
      
      // 비밀번호가 이미 저장되어 있으면 모달 표시하지 않고 처리 계속
      if (hasPassword) {
        console.log(`계좌 ${accountNumber}의 비밀번호가 이미 저장되어 있습니다.`);
        // 계좌 변경 후 스크롤 위치 조정 (300ms 지연)
        setTimeout(() => {
          console.log('계좌 변경 후 스크롤 위치 조정');
          scrollViewRef.current?.scrollTo({ x: 0, animated: false });
          setCurrentPageIndex(0);
          setCurrentRecordIndex(0);
        }, 300);
        return;
      }
      
      // connectedId 찾기
      let connectedId = '';
      
      // 1. 인덱스 기반 매핑 시도
      if (connectedAccounts.length > index) {
        if (typeof connectedAccounts[index] === 'string') {
          connectedId = connectedAccounts[index];
        } else if (typeof connectedAccounts[index] === 'object' && connectedAccounts[index] !== null) {
          connectedId = connectedAccounts[index].connectedId || '';
        }
      }
      
      // 2. 계좌번호 기반 매핑 시도
      if (!connectedId) {
        const foundConnectedId = findConnectedIdByAccountNumber(accountNumber);
        if (foundConnectedId) {
          connectedId = foundConnectedId;
        }
      }
      
      // 3. 그래도 없으면 첫 번째 connectedId 사용
      if (!connectedId && connectedAccounts.length > 0) {
        if (typeof connectedAccounts[0] === 'string') {
          connectedId = connectedAccounts[0];
        } else if (typeof connectedAccounts[0] === 'object' && connectedAccounts[0] !== null) {
          connectedId = connectedAccounts[0].connectedId || '';
        }
      }
      
      console.log(`계좌 ${accountNumber}에 매핑된 connectedId: ${connectedId}`);
      
      if (connectedId) {
        // connectedId가 있고, 비밀번호가 없는 경우에만 모달 표시
        if (!hasPassword) {
          // 비밀번호가 없는 경우 모달 표시
          setSelectedAccountForPassword({account, connectedId});
          setAccountPassword('');
          setPasswordError('');
          setShowAccountPasswordModal(true);
        }
      } else {
        // connectedId가 없으면 알림
        Alert.alert('알림', '이 계좌와 연결된 Connected ID가 없습니다.');
      }
    }
    
    // 계좌 변경 후 스크롤 위치 조정 (300ms 지연)
    setTimeout(() => {
      console.log('계좌 변경 후 스크롤 위치 조정');
      scrollViewRef.current?.scrollTo({ x: 0, animated: false });
      setCurrentPageIndex(0);
      setCurrentRecordIndex(0);
    }, 300);
  };

  // 리밸런싱 기록 선택 핸들러 (수정)
  const handleRecordSelect = (record_id: number) => {
    setSelectedRecordId(record_id);
    setRecordDropdownVisible(false);
    
    // 선택된 기록의 인덱스 찾기
    const index = recordNames.findIndex(item => item.record_id === record_id);
    if (index !== -1) {
      setCurrentRecordIndex(index);
      // 스크롤 뷰 위치 조정
      scrollViewRef.current?.scrollTo({ x: index * screenWidth, animated: true });
    }
  };

  // 컴포넌트 마운트 시 스크롤 위치 초기화
  useEffect(() => {
    console.log('컴포넌트 마운트 - 스크롤 위치 초기화');
    // UI 렌더링 완료 후 스크롤 위치 설정 (지연 처리)
    const delayAdjust = () => {
      setTimeout(() => {
        console.log('스크롤 위치 지연 조정 실행');
        adjustScrollPosition();
      }, 100);
    };
    
    InteractionManager.runAfterInteractions(() => {
      delayAdjust();
      
      // 추가 보장을 위해 0.5초, 1초 후에 한번 더 실행
      const timer1 = setTimeout(delayAdjust, 500);
      const timer2 = setTimeout(delayAdjust, 1000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    });
  }, []);

  // 스와이프 종료 후 핸들러
  const handleScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    // 카드 너비와 마진을 고려한 페이지 계산
    const newIndex = Math.round(contentOffsetX / cardTotalWidth);
    
    // 현재 페이지 인덱스 업데이트
    setCurrentPageIndex(newIndex);
    
    // 맨 오른쪽(포트폴리오 추가 카드)인 경우
    const totalPages = recordNames.length > 0 ? recordNames.length + 1 : 2; // +1은 추가 카드
    if (newIndex === totalPages - 1) {
      // 포트폴리오 추가 모달 표시
      setShowLoadPortfolioModal(true);
      // 스크롤 위치를 다시 왼쪽으로 복원
      setTimeout(() => {
        const targetX = recordNames.length > 0 ? 0 : 0; // 첫 번째 카드로
        scrollViewRef.current?.scrollTo({ x: targetX, animated: true });
        setCurrentPageIndex(0);
        setCurrentRecordIndex(recordNames.length > 0 ? 0 : -1);
      }, 300);
      return;
    }
    
    // 기록이 없는 경우 특별 처리
    if (recordNames.length === 0) {
      // 기록 없음 카드가 항상 왼쪽에 보이도록 처리
      setCurrentRecordIndex(-1);
      return;
    }
    
    // 실제 기록 인덱스 계산 (더 이상 포트폴리오 카드를 고려할 필요 없음)
    const actualIndex = newIndex;
    
    if (actualIndex !== currentRecordIndex && actualIndex >= 0 && actualIndex < recordNames.length) {
      setCurrentRecordIndex(actualIndex);
      // 기록 ID 업데이트
      const record_id = recordNames[actualIndex]?.record_id;
      if (record_id) {
        setSelectedRecordId(record_id);
      }
    }
  };

  // 리밸런싱 기록 수정 버튼 핸들러
  const handleEditRecord = () => {
    if (currentRecord) {
      nav.navigate('PortfolioEditor', { portfolioId: currentRecord.record_id });
    } else {
      Alert.alert('알림', '수정할 리밸런싱 기록이 없습니다.');
    }
  };

  // 포트폴리오 불러오기 핸들러
  const handleLoadPortfolio = () => {
    nav.navigate('PortfolioEditor');
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
      const account = dummyAccounts[dummyAccountIndex >= 0 ? dummyAccountIndex : 0];
      const secFirm = findSecuritiesFirmByName(account.company);
      const displayName = secFirm?.shortName || account.company;
      return `${displayName} (${account.account.slice(-4)})`;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsHorizontalScrollIndicator={false}
    >
      {/* 계좌 선택 */}
      <View style={styles.accountSelectorContainer}>
        {/* 계좌 선택 컴포넌트 */}
        <AccountSelectorComponent 
          theme={theme}
          accounts={stockAccounts.length > 0 ? stockAccounts : []}
          selectedAccountIndex={selectedAccountIndex < stockAccounts.length ? selectedAccountIndex : 0}
          onAccountChange={handleAccountChange}
          isLoading={isLoading}
        />
        
        {/* 로딩 상태 표시 */}
        {isLoading ? (
          <Text style={styles.accountText}>증권 계좌 정보를 불러오는 중...</Text>
        ) : stockAccounts.length === 0 && loggedToken ? (
          <Text style={styles.accountText}>등록된 증권 계좌가 없습니다</Text>
        ) : null}
      </View>

      {/* 리밸런싱 기록 스와이프 영역 */}
      <View style={styles.recordSwipeContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          snapToInterval={cardTotalWidth}
          decelerationRate="fast"
          snapToAlignment="start"
          contentContainerStyle={{ 
            paddingLeft: 16,
            paddingRight: 16
          }}
        >
          {/* 기록이 없을 때 표시할 카드 */}
          {recordNames.length === 0 ? (
            <View style={[styles.recordItemContainer, { width: cardWidth }]}>
              <View style={{alignItems: 'center', justifyContent: 'center', padding: 20}}>
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
            // 기존 기록 카드들
            recordNames.map((record, index) => (
              <View key={record.record_id} style={[styles.recordItemContainer, { width: cardWidth }]}>
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
                
                {/* 계좌 정보 영역 - 수직 방향 정렬 */}
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
                    <Text style={[getProfitStyle(totalProfit)]}>
                      {formatProfit(totalProfit, currencyType)}({totalProfitPercent.toFixed(1)}%)
                    </Text>
                  </View>
                  
                  <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                    <Text style={styles.infoLabel}>일간 수익</Text>
                    <Text style={[getProfitStyle(dailyProfit)]}>
                      {formatProfit(dailyProfit, currencyType)}({dailyProfitPercent.toFixed(1)}%)
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
          
          {/* 포트폴리오 추가 카드 (맨 오른쪽) */}
          <View style={[styles.loadPortfolioContainer, { width: cardWidth }]}>
            <Text style={styles.loadPortfolioIcon}>+</Text>
            <Text style={styles.addRecordText}>새 포트폴리오 추가하기</Text>
          </View>
        </ScrollView>
        
        {/* 페이지 인디케이터 */}
        <View style={styles.recordPaginationContainer}>
          {/* 기록 없음 인디케이터 (기록이 없을 때만 표시) 또는 기존 기록 인디케이터 */}
          {recordNames.length === 0 ? (
            <>
              <View
                style={[
                  styles.paginationDot,
                  currentPageIndex === 0 ? styles.activePaginationDot : null
                ]}
              />
              {/* 포트폴리오 추가 버튼 인디케이터 */}
              <View
                style={[
                  styles.paginationDot,
                  currentPageIndex === 1 ? styles.activePaginationDot : null
                ]}
              />
            </>
          ) : (
            /* 기존 기록 인디케이터 + 추가 버튼 인디케이터 */
            <>
              {recordNames.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    currentPageIndex === index ? styles.activePaginationDot : null
                  ]}
                />
              ))}
              {/* 포트폴리오 추가 버튼 인디케이터 */}
              <View
                style={[
                  styles.paginationDot,
                  currentPageIndex === recordNames.length ? styles.activePaginationDot : null
                ]}
              />
            </>
          )}
        </View>
      </View>

      {/* 통화 전환 버튼 - 현금 영역 위에 배치 */}
      <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10, marginTop: 2, marginRight: 2}}>
        {/* 화면 회전 버튼 */}
        <TouchableOpacity 
          style={styles.rotateButton}
          onPress={handleRotateScreen}
        >
          <Text style={styles.rotateButtonText}>↻</Text>
        </TouchableOpacity>
        
        <View style={styles.currencyToggleContainer}>
          <TouchableOpacity
            style={[
              styles.currencyButton,
              currencyType === 'dollar' ? styles.activeCurrency : null
            ]}
            onPress={() => setCurrencyType('dollar')}
          >
            <Text style={[
              styles.currencyText,
              currencyType === 'dollar' ? styles.activeCurrencyText : null
            ]}>$</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.currencyButton,
              currencyType === 'won' ? styles.activeCurrency : null
            ]}
            onPress={() => setCurrencyType('won')}
          >
            <Text style={[
              styles.currencyText,
              currencyType === 'won' ? styles.activeCurrencyText : null
            ]}>원</Text>
          </TouchableOpacity>
        </View>
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

      {/* 포트폴리오 추가 모달 */}
      <Modal
        visible={showLoadPortfolioModal}
        transparent
        animationType="fade"
      >
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPressOut={() => setShowLoadPortfolioModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 16}}>
              새 포트폴리오 추가하기
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.primary,
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 16
              }}
              onPress={handleLoadPortfolio}
            >
              <Text style={{color: '#FFF', fontWeight: 'bold'}}>추가하기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 계좌 비밀번호 모달 - 공통 컴포넌트 사용 */}
      <AccountPasswordModal
        theme={theme}
        visible={showAccountPasswordModal}
        account={selectedAccountForPassword ? 
          {
            company: selectedAccountForPassword.account.company,
            accountNumber: selectedAccountForPassword.account.accountNumber
          } : null}
        password={accountPassword}
        onChangePassword={setAccountPassword}
        onConfirm={saveAccountPassword}
        onCancel={() => setShowAccountPasswordModal(false)}
        isLoading={saveInProgress}
        errorMessage={passwordError}
      />
    </ScrollView>
  );
};

export default withTheme(RebalancingComponent);