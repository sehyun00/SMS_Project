// 파일 경로: src/components/RecordComponent.tsx
// 컴포넌트 흐름: App.js > AppNavigator.js > MainPage.jsx > RecordComponent.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MainPageNavigationProp } from '../../../types/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useAccounts } from '../../../context/AccountsContext';
import { fetchStockAccounts } from '../../../api/homeApi';
import { fetchConnectedAccounts } from '../../../api/connectedAccountApi';
import { fetchRebalancingRecords } from '../../../api/rebalancingApi';
import { findSecuritiesFirmByName } from '../../../data/organizationData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { FLASK_SERVER_URL } from '../../../constants/config';
import { useExchangeRate } from '../../../hooks/useExchangeRate';
import { getAccountBalance } from '../../../api/connectedAccountApi';

// 더미 데이터 임포트
import {
  dummyAccounts,
  dummyRecords,
  getAccountRecords,
  getRecordRuds,
  getCurrentExchangeRate
} from '../../../data/dummyData';

// 스타일 임포트
import { createStyles } from '../../../styles/components/recordComponent.styles';

// 테마 훅 임포트
import { useTheme } from '../../../styles/theme/ThemeContext';

// 컴포넌트 임포트
import AccountPasswordModal from '../../../components/common/modals/AccountPasswordModal';

// API에서 가져오는 계좌 정보 인터페이스
interface ApiAccountInfo {
  company: string;
  accountNumber: string;
  principal?: number;
  returnRate: number;
}

// 리밸런싱 기록 응답 인터페이스
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

// Record 인터페이스 정의
interface Record {
  record_id: number;
  account: string;
  record_date: string;
  total_balance: number;
  record_name?: string;
  memo?: string;
  profit_rate?: number;
}

// 계좌 요약 정보 인터페이스
interface AccountSummary {
  company: string;
  account: string;
  balance: number;
  totalProfit: number;
  totalProfitRate: number;
  records: Record[];
  isLoading?: boolean;
}

// 컴포넌트 props 인터페이스 정의
interface RecordComponentProps {
  navigation?: MainPageNavigationProp;
}

// React.FC를 사용해 함수 컴포넌트 타입 지정
const RecordComponent: React.FC<RecordComponentProps> = ({ navigation }) => {
  // 테마 가져오기
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // 네비게이션 및 인증 훅
  const defaultNavigation = useNavigation<MainPageNavigationProp>();
  const nav = navigation || defaultNavigation;
  const { loggedToken } = useAuth();
  const { accounts: savedAccounts, addAccount: saveAccount, updateAccount } = useAccounts();

  // 환율 정보 가져오기
  const { exchangeRate } = useExchangeRate();
  const currentExchangeRate = exchangeRate || getCurrentExchangeRate();

  // 기본 상태들
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<number | null>(null);
  
  // API 관련 상태들
  const [stockAccounts, setStockAccounts] = useState<ApiAccountInfo[]>([]);
  const [allAccountRecords, setAllAccountRecords] = useState<{[key: string]: GetRebalancingResponse[]}>({});
  const [loadingAccounts, setLoadingAccounts] = useState<Set<string>>(new Set());
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);

  // 실시간 계좌 잔고 상태 추가
  const [realtimeBalances, setRealtimeBalances] = useState<{[key: string]: any}>({});
  const [isLoadingRealtimeBalance, setIsLoadingRealtimeBalance] = useState<Set<string>>(new Set());

  // 계좌 비밀번호 모달 상태
  const [showAccountPasswordModal, setShowAccountPasswordModal] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [selectedAccountForPassword, setSelectedAccountForPassword] = useState<{account: ApiAccountInfo, connectedId: string} | null>(null);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // 필드 입력 상태
  const [isSecurityCompanySelected, setIsSecurityCompanySelected] = useState(false);
  const [isSocialIdEntered, setIsSocialIdEntered] = useState(false);
  const [isSocialPasswordEntered, setIsSocialPasswordEntered] = useState(false);
  const [isAccountNumberEntered, setIsAccountNumberEntered] = useState(false);
  const [isAccountPasswordEntered, setIsAccountPasswordEntered] = useState(false);

  // 스크롤 관리
  const scrollViewRef = useRef<ScrollView>(null);

  // 계좌 요약 정보 상태
  const [accountSummaries, setAccountSummaries] = useState<AccountSummary[]>([]);

  // 증권사 이름으로 기관코드 찾기
  const getOrganizationCode = (companyName: string): string => {
    const firm = findSecuritiesFirmByName(companyName);
    if (firm) {
      console.log(`증권사 ${companyName} -> 코드 ${firm.code} 변환 성공`);
      return firm.code;
    } else {
      console.warn(`증권사 코드를 찾을 수 없음: ${companyName}`);
      return '0240'; // 기본 코드 (삼성증권)
    }
  };

  // 로컬에 저장된 계좌 정보 찾기
  const findSavedAccount = (accountNumber: string, organization: string) => {
    return savedAccounts.find(acc => 
      acc.account === accountNumber && acc.organization === organization
    );
  };

  // 계좌 비밀번호 확인
  const checkSavedPassword = async (accountNumber: string, organization: string): Promise<boolean> => {
    const savedAccount = findSavedAccount(accountNumber, organization);
    const hasContextPassword = !!(savedAccount && savedAccount.account_password);
    
    let hasDirectPassword = false;
    try {
      const directPassword = await AsyncStorage.getItem(`direct_password_${accountNumber}`);
      hasDirectPassword = !!directPassword;
    } catch (err) {
      console.error('직접 저장소 확인 오류:', err);
    }
    
    return hasContextPassword || hasDirectPassword;
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
      
      const firmInfo = findSecuritiesFirmByName(selectedAccountForPassword.account.company);
      if (!firmInfo) {
        throw new Error(`증권사 ${selectedAccountForPassword.account.company}에 대한 코드를 찾을 수 없습니다.`);
      }
      
      const organization = firmInfo.code;
      const accountNumber = selectedAccountForPassword.account.accountNumber;
      const connectedId = selectedAccountForPassword.connectedId;
      
      console.log('계좌 비밀번호 확인 시도:', {
        connectedId,
        organization,
        account: accountNumber,
        account_password: '******'
      });
      
      try {
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
        
        if (response.data.result.code === 'CF-00000') {
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
              
              if (selectedAccountForPassword) {
                loadAccountRecords(selectedAccountForPassword.account.accountNumber);
              }
            }}
          ]);
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
  };

  // 실시간 계좌 잔고 조회 함수 추가
  const loadRealtimeAccountBalance = async (accountNumber: string) => {
    if (!loggedToken) {
      console.log('실시간 잔고 조회 중단: 토큰 없음');
      return;
    }

    // 로딩 상태 추가
    setIsLoadingRealtimeBalance(prev => new Set(prev).add(accountNumber));

    try {
      const account = stockAccounts.find(acc => acc.accountNumber === accountNumber);
      if (!account) {
        console.error('계좌 정보를 찾을 수 없음:', accountNumber);
        return;
      }

      // connectedId 찾기
      const accountIndex = stockAccounts.findIndex(acc => acc.accountNumber === accountNumber);
      let connectedId = '';
      
      if (accountIndex !== -1 && connectedAccounts.length > accountIndex) {
        const connectedAccount = connectedAccounts[accountIndex];
        if (typeof connectedAccount === 'string') {
          connectedId = connectedAccount;
        } else if (typeof connectedAccount === 'object' && connectedAccount) {
          connectedId = connectedAccount.connectedId || '';
        }
      }

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
        
        // 실시간 총 자산 계산
        let totalAmount = parseFloat(apiData.rsTotAmt || apiData.rsTotValAmt || '0');
        
        // 총평가금액이 0이면 직접 계산
        if (totalAmount === 0) {
          const depositAmount = parseFloat(apiData.resDepositReceivedD2 || apiData.resDepositReceived || '0');
          const stocksValue = (apiData.resItemList || []).reduce((total: number, item: any) => {
            const itemValue = parseFloat(item.resValuationAmt || '0');
            return total + itemValue;
          }, 0);
          totalAmount = depositAmount + stocksValue;
        }
        
        const balanceData = {
          krwCash: parseFloat(apiData.resDepositReceivedD2 || apiData.resDepositReceived || '0'),
          totalAmount, // 실시간 총 자산 (원화)
          totalAmountUSD: totalAmount / currentExchangeRate, // 달러로 환산
        };

        console.log('[실시간 잔고] 조회 성공:', {
          accountNumber,
          krwCash: balanceData.krwCash,
          totalAmount: balanceData.totalAmount,
          totalAmountUSD: balanceData.totalAmountUSD
        });

        setRealtimeBalances(prev => ({
          ...prev,
          [accountNumber]: balanceData
        }));
      } else {
        console.error('실시간 잔고 조회 실패:', response.data.result.message);
      }
    } catch (error) {
      console.error('[실시간 잔고] 조회 중 오류:', error);
    } finally {
      // 로딩 상태 제거
      setIsLoadingRealtimeBalance(prev => {
        const newSet = new Set(prev);
        newSet.delete(accountNumber);
        return newSet;
      });
    }
  };

  // 특정 계좌의 리밸런싱 기록 조회 (실시간 잔고 조회 추가)
  const loadAccountRecords = async (accountNumber: string) => {
    if (!loggedToken) {
      console.log('기록 조회 중단: 토큰 없음');
      return;
    }
    
    // 로딩 상태 추가
    setLoadingAccounts(prev => new Set(prev).add(accountNumber));
    
    try {
      console.log('[기록] 기록 조회 시도:', {
        account: accountNumber,
        token: loggedToken ? '토큰 있음' : '토큰 없음'
      });
      
      const result = await fetchRebalancingRecords(loggedToken, accountNumber);
      console.log('[기록] 기록 조회 결과:', {
        success: result.success,
        isDummy: result.isDummy,
        recordCount: result.data?.length || 0
      });
      
      if (result.success && result.data !== undefined) {
        setAllAccountRecords(prev => ({
          ...prev,
          [accountNumber]: result.data || []
        }));
        console.log('[기록] API 데이터 로드 완료:', result.data.length);
      } else {
        console.log('[기록] API 호출 실패, 더미 데이터 사용');
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
        setAllAccountRecords(prev => ({
          ...prev,
          [accountNumber]: convertedRecords
        }));
      }

      // 실시간 계좌 잔고 조회 추가
      await loadRealtimeAccountBalance(accountNumber);
      
    } catch (error) {
      console.error('[기록] 기록 조회 중 예상치 못한 오류:', error);
      console.log('[기록] 예외 발생으로 더미 데이터 사용');
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
      setAllAccountRecords(prev => ({
        ...prev,
        [accountNumber]: convertedRecords
      }));

      // 더미 데이터 사용 시에도 실시간 잔고 조회 시도
      await loadRealtimeAccountBalance(accountNumber);
    } finally {
      // 로딩 상태 제거
      setLoadingAccounts(prev => {
        const newSet = new Set(prev);
        newSet.delete(accountNumber);
        return newSet;
      });
    }
  };

  // 모든 계좌의 기록을 자동으로 조회하는 함수
  const loadAllAccountRecords = async () => {
    for (let i = 0; i < stockAccounts.length; i++) {
      const account = stockAccounts[i];
      const organizationCode = getOrganizationCode(account.company);
      
      // 저장된 비밀번호가 있는지 확인
      const hasPassword = await checkSavedPassword(account.accountNumber, organizationCode);
      
      if (hasPassword) {
        console.log(`계좌 ${account.accountNumber}: 저장된 비밀번호로 자동 조회`);
        await loadAccountRecords(account.accountNumber);
      } else {
        console.log(`계좌 ${account.accountNumber}: 저장된 비밀번호 없음`);
        // 비밀번호가 없는 계좌는 빈 배열로 설정
        setAllAccountRecords(prev => ({
          ...prev,
          [account.accountNumber]: []
        }));
      }
    }
  };

  // 초기 데이터 로딩
  useEffect(() => {
    const getConnectedAccounts = async () => {
      try {
        const accounts = await fetchConnectedAccounts();
        console.log('Connected Accounts:', accounts);
        setConnectedAccounts(accounts);
        getStockAccounts(accounts);
      } catch (error) {
        console.error('계좌 연결 ID 조회 실패:', error);
      }
    };

    const getStockAccounts = async (connectedAccountsList: any[]) => {
      try {
        if (!loggedToken) {
          console.log('토큰 없음');
          return;
        }

        const stockAccountsResult = await fetchStockAccounts(loggedToken);
        console.log('Stock Accounts:', stockAccountsResult.data);
        if (stockAccountsResult.success && stockAccountsResult.data) {
          setStockAccounts(stockAccountsResult.data);
        }
      } catch (error) {
        console.error('증권 계좌 정보 조회 실패:', error);
      }
    };

    getConnectedAccounts();
  }, [loggedToken]);

  // 계좌 정보 로드 완료 후 모든 계좌 기록 조회
  useEffect(() => {
    if (stockAccounts.length > 0 && connectedAccounts.length > 0) {
      console.log('모든 계좌 데이터 로드 완료, 자동 기록 조회 시작');
      loadAllAccountRecords();
    }
  }, [stockAccounts, connectedAccounts, savedAccounts]);

  // 계좌 요약 정보 생성 - 실제 API 데이터 기반으로 수정
  useEffect(() => {
    if (stockAccounts.length > 0) {
      const summaries = stockAccounts.map((account, index) => {
        const accountRecords = allAccountRecords[account.accountNumber] || [];
        const isLoading = loadingAccounts.has(account.accountNumber) || isLoadingRealtimeBalance.has(account.accountNumber);
        
        // 실제 API 데이터에서 원금 가져오기 (백엔드의 principal 값)
        const principal = account.principal || 0;
        
        // 실시간 잔고 정보 가져오기
        const realtimeBalance = realtimeBalances[account.accountNumber];
        
        // 실시간 잔고가 있으면 실제 데이터 사용, 없으면 기본값
        const currentBalance = realtimeBalance ? realtimeBalance.totalAmount : principal;
        
        // 총 수익 계산: 현재 잔고 - 원금
        const totalProfit = currentBalance - principal;
        const totalProfitRate = principal > 0 ? (totalProfit / principal) * 100 : 0;

        console.log(`[계좌 요약 계산] ${account.accountNumber}:`, {
          principal,
          currentBalance,
          totalProfit,
          totalProfitRate: totalProfitRate.toFixed(1),
          hasRealtimeBalance: !!realtimeBalance
        });

        return {
          company: account.company,
          account: account.accountNumber,
          balance: currentBalance,
          totalProfit,
          totalProfitRate: parseFloat(totalProfitRate.toFixed(1)),
          isLoading,
          records: accountRecords.map(record => ({
            record_id: record.record_id,
            account: record.account,
            record_date: record.record_date,
            total_balance: record.total_balance,
            record_name: record.record_name,
            memo: record.memo,
            profit_rate: record.profit_rate
          }))
        };
      });

      setAccountSummaries(summaries);
    } else {
      setAccountSummaries([]);
    }
  }, [stockAccounts, allAccountRecords, loadingAccounts, isLoadingRealtimeBalance, realtimeBalances]);

  // 계좌 비밀번호 입력 요청 핸들러
  const handleRequestPassword = (accountNumber: string) => {
    const account = stockAccounts.find(acc => acc.accountNumber === accountNumber);
    if (!account) return;
    
    // connectedId 찾기 - 계좌번호로 매칭 (여러 형태 시도)
    let connectedId = '';
    
    // 1. 전체 계좌번호로 매칭 시도
    let matchingConnectedAccount = connectedAccounts.find(connAcc => {
      if (typeof connAcc === 'object' && connAcc.accountNumber) {
        return connAcc.accountNumber === accountNumber;
      }
      return false;
    });
    
    // 2. 전체 계좌번호로 매칭 실패 시, 마지막 4자리로 매칭 시도
    if (!matchingConnectedAccount) {
      const accountLast4 = accountNumber.slice(-4);
      matchingConnectedAccount = connectedAccounts.find(connAcc => {
        if (typeof connAcc === 'object' && connAcc.accountNumber) {
          return connAcc.accountNumber === accountLast4 || connAcc.accountNumber.endsWith(accountLast4);
        }
        return false;
      });
      console.log(`전체 계좌번호 매칭 실패, 마지막 4자리(${accountLast4})로 매칭 시도`);
    }
    
    // 3. 매칭된 connectedId가 있으면 사용
    if (matchingConnectedAccount && typeof matchingConnectedAccount === 'object') {
      connectedId = matchingConnectedAccount.connectedId;
      console.log(`계좌 ${accountNumber}와 connectedId ${connectedId} 매칭됨`);
    } else {
      // 4. 여전히 매칭되지 않으면 에러 처리
      console.error(`계좌 ${accountNumber}에 매칭되는 connectedId를 찾을 수 없음`);
      console.log('Available connectedAccounts:', connectedAccounts);
      Alert.alert('오류', '해당 계좌의 연결 정보를 찾을 수 없습니다. 계좌를 다시 등록해주세요.');
      return;
    }
    
    if (connectedId) {
      handleAccountPasswordRequired(account, connectedId);
    } else {
      Alert.alert('오류', '연결된 계좌 정보를 찾을 수 없습니다.');
    }
  };

  // 날짜를 "YYYY.MM.DD" 형식으로 포맷
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  // 리밸런싱 기록 클릭 핸들러
  const handleRecordClick = (recordId: number) => {
    if (navigation) {
      navigation.navigate('PortfolioEditor', { portfolioId: recordId });
    } else {
      setSelectedRecord(selectedRecord === recordId ? null : recordId);
      const recordRuds = getRecordRuds(recordId);
      console.log('선택된 리밸런싱 기록 상세:', recordRuds);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 로딩 상태 표시 */}
      {isLoading && (
        <View style={{marginBottom: 16, alignItems: 'center'}}>
          <Text style={styles.infoLabel}>증권 계좌 정보를 불러오는 중...</Text>
        </View>
      )}

      {/* 계좌가 없는 경우 */}
      {stockAccounts.length === 0 && !isLoading && loggedToken && (
        <View style={styles.accountCard}>
          <Text style={[styles.infoLabel, { textAlign: 'center', marginTop: 20 }]}>
            등록된 증권 계좌가 없습니다
          </Text>
        </View>
      )}

      {/* 모든 계좌별 기록 표시 */}
      {accountSummaries.map((summary, index) => (
        <View key={index} style={styles.accountCard}>
          {/* 계좌 번호 */}
          <View style={styles.accountHeader}>
            <Text style={styles.accountCompanay}>{summary.company}</Text>
            <Text style={styles.accountNumber}>{summary.account}</Text>
          </View>

          {/* 잔고 정보 */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>잔고</Text>
            <Text style={styles.infoValue}>{summary.balance.toLocaleString()}원</Text>
          </View>

          {/* 총 수익 정보 */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>총 수익</Text>
            <Text style={[
              styles.infoValue,
              summary.totalProfit < 0 ? styles.negativeValue : styles.positiveValue
            ]}>
              {summary.totalProfit < 0 ? '' : '+'}
              {summary.totalProfit.toLocaleString()}원
              ({summary.totalProfitRate.toFixed(1)}%)
            </Text>
          </View>

          {/* 기록 로딩 중이거나 기록이 없는 경우 */}
          {summary.isLoading ? (
            <View style={{marginTop: 16, alignItems: 'center'}}>
              <Text style={styles.infoLabel}>기록을 불러오는 중...</Text>
            </View>
          ) : summary.records.length === 0 ? (
            <View style={{marginTop: 16, alignItems: 'center'}}>
              <Text style={styles.infoLabel}>기록이 없습니다</Text>
              <TouchableOpacity
                style={{marginTop: 8, padding: 8, backgroundColor: theme.colors.primary, borderRadius: 8}}
                onPress={() => handleRequestPassword(summary.account)}
              >
                <Text style={{color: theme.colors.card, fontSize: 12}}>계좌 비밀번호 입력</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
          {/* 리밸런싱 기록 테이블 헤더 */}
          <View style={styles.tableHeader}>
            <Text style={styles.headerText}>기록 명</Text>
            <Text style={styles.headerText}>저장 날짜</Text>
            <Text style={styles.headerText}>수익률</Text>
          </View>

          {/* 리밸런싱 기록 목록 */}
          {summary.records.map((record, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={[
                styles.recordRow,
                selectedRecord === record.record_id ? styles.selectedRecord : null
              ]}
              onPress={() => handleRecordClick(record.record_id)}
              activeOpacity={0.7}
            >
              <Text style={styles.recordName}>{record.record_name || '기본 전략'}</Text>
              <Text style={styles.recordDate}>{formatDate(record.record_date)}</Text>
              <Text style={[
                styles.recordProfit,
                (record.profit_rate || 0) < 0 ? styles.negativeValue : styles.positiveValue
              ]}>
                {(record.profit_rate || 0) < 0 ? '' : '+'}
                {record.profit_rate?.toFixed(1) || '0.0'}%
              </Text>
            </TouchableOpacity>
          ))}
          
          {/* 선택된 기록의 상세 정보 표시 */}
          {selectedRecord && summary.records.some(r => r.record_id === selectedRecord) && (() => {
            const selectedRecordData = summary.records.find(r => r.record_id === selectedRecord);
            const recordRuds = getRecordRuds(selectedRecord);
            
            // 현금, 국내주식, 해외주식으로 분류
            const cashAssets = recordRuds.filter(rud => rud.stock_region === 0);
            const domesticStocks = recordRuds.filter(rud => rud.stock_region === 1);
            const foreignStocks = recordRuds.filter(rud => rud.stock_region === 2);
            
            // 총 평가액 계산 (원화 기준)
            const totalValueKRW = recordRuds.reduce((total, rud) => {
              if (rud.stock_region === 0) { // 현금
                return total + rud.won + (rud.dollar * currentExchangeRate);
              } else if (rud.stock_region === 1) { // 국내주식
                return total + rud.won;
              } else { // 해외주식
                return total + (rud.dollar * currentExchangeRate);
              }
            }, 0);

            return (
              <View style={styles.recordDetail}>
                {/* 헤더 */}
                <View style={styles.recordDetailHeader}>
                  <Text style={styles.recordDetailTitle}>📊 리밸런싱 상세 분석</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setSelectedRecord(null)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* 기본 정보 */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>📋 기본 정보</Text>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailLabel}>전략명</Text>
                    <Text style={styles.detailValue}>{selectedRecordData?.record_name || '기본 전략'}</Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailLabel}>저장일시</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedRecordData?.record_date || '')}</Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailLabel}>총 평가액</Text>
                    <Text style={styles.detailValue}>{totalValueKRW.toLocaleString()}원</Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailLabel}>전체 수익률</Text>
                    <Text style={[
                      styles.detailValue,
                      (selectedRecordData?.profit_rate || 0) >= 0 ? styles.positiveValue : styles.negativeValue
                    ]}>
                      {(selectedRecordData?.profit_rate || 0) >= 0 ? '+' : ''}
                      {(selectedRecordData?.profit_rate || 0).toFixed(1)}%
                    </Text>
                  </View>
                  {selectedRecordData?.memo && (
                    <View style={styles.detailInfoRow}>
                      <Text style={styles.detailLabel}>메모</Text>
                      <Text style={styles.detailValue}>{selectedRecordData.memo}</Text>
                    </View>
                  )}
                </View>

                {/* 현금 보유 현황 */}
                {cashAssets.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>💰 현금 보유 현황</Text>
                    {cashAssets.map((asset, idx) => (
                      <View key={idx} style={styles.assetRow}>
                        <View style={styles.assetInfo}>
                          <Text style={styles.assetName}>{asset.stock_name}</Text>
                          <Text style={styles.assetWeight}>{asset.expert_per}%</Text>
                        </View>
                        <View style={styles.assetValues}>
                          <Text style={styles.assetAmount}>
                            {asset.stock_name === '원화' ? 
                              `${asset.won.toLocaleString()}원` : 
                              `$${asset.dollar.toLocaleString()}`
                            }
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* 국내 주식 */}
                {domesticStocks.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>🇰🇷 국내 주식</Text>
                    {domesticStocks.map((stock, idx) => (
                      <View key={idx} style={styles.assetRow}>
                        <View style={styles.assetInfo}>
                          <Text style={styles.assetName}>{stock.stock_name}</Text>
                          <Text style={styles.assetDetails}>
                            {stock.nos}주 × {stock.market_order.toLocaleString()}원
                          </Text>
                        </View>
                        <View style={styles.assetValues}>
                          <Text style={styles.assetWeight}>{stock.expert_per}%</Text>
                          <Text style={[
                            styles.assetReturn,
                            stock.rate >= 0 ? styles.positiveValue : styles.negativeValue
                          ]}>
                            {stock.rate >= 0 ? '+' : ''}{stock.rate.toFixed(1)}%
                          </Text>
                          <Text style={styles.assetAmount}>{stock.won.toLocaleString()}원</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* 해외 주식 */}
                {foreignStocks.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>🌍 해외 주식</Text>
                    {foreignStocks.map((stock, idx) => (
                      <View key={idx} style={styles.assetRow}>
                        <View style={styles.assetInfo}>
                          <Text style={styles.assetName}>{stock.stock_name}</Text>
                          <Text style={styles.assetDetails}>
                            {stock.nos}주 × ${stock.market_order.toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.assetValues}>
                          <Text style={styles.assetWeight}>{stock.expert_per}%</Text>
                          <Text style={[
                            styles.assetReturn,
                            stock.rate >= 0 ? styles.positiveValue : styles.negativeValue
                          ]}>
                            {stock.rate >= 0 ? '+' : ''}{stock.rate.toFixed(1)}%
                          </Text>
                          <Text style={styles.assetAmount}>
                            ${stock.dollar.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* 포트폴리오 구성 차트 (간단한 막대 그래프) */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>📈 포트폴리오 구성</Text>
                  <View style={styles.chartContainer}>
                    {recordRuds.map((asset, idx) => (
                      <View key={idx} style={styles.chartRow}>
                        <Text style={styles.chartLabel}>{asset.stock_name}</Text>
                        <View style={styles.chartBarContainer}>
                          <View 
                            style={[
                              styles.chartBar, 
                              { 
                                width: `${asset.expert_per}%`,
                                backgroundColor: asset.stock_region === 0 ? '#FFD700' : 
                                                asset.stock_region === 1 ? '#4CAF50' : '#2196F3'
                              }
                            ]} 
                          />
                          <Text style={styles.chartPercentage}>{asset.expert_per}%</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* 액션 버튼들 */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => {
                      if (navigation) {
                        navigation.navigate('PortfolioEditor', { portfolioId: selectedRecord });
                      }
                    }}
                  >
                    <Text style={styles.actionButtonText}>✏️ 편집하기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
                    onPress={() => {
                      Alert.alert(
                        '포트폴리오 복사',
                        '이 포트폴리오를 새로운 리밸런싱의 기준으로 사용하시겠습니까?',
                        [
                          { text: '취소', style: 'cancel' },
                          { text: '복사', onPress: () => {
                            // TODO: 포트폴리오 복사 기능 구현
                            Alert.alert('알림', '포트폴리오가 복사되었습니다.');
                          }}
                        ]
                      );
                    }}
                  >
                    <Text style={styles.actionButtonText}>📋 복사하기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}
            </>
          )}
        </View>
      ))}

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

export default RecordComponent;
