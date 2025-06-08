// 파일 경로: src/components/MyStockAccountComponent.tsx
// 컴포넌트 흐름: App.js > AppNavigator.js > MainPage.jsx > MyStockAccountComponent.tsx

import React, { useEffect, useState, ReactElement, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 컴포넌트 임포트
import CircularGraphComponent from '../../../components/common/graphs/CircularGraphComponent';
import IndividualStockComponent from '../../../components/portfolio/IndividualStockComponent';
import AccountPasswordModal from '../../../components/common/modals/AccountPasswordModal';
import AccountSelectorComponent from '../../../components/account/AccountSelectorComponent';
import CurrencyToggle from '../../../components/common/ui/CurrencyToggle';

// API 임포트
import { 
  fetchConnectedAccounts, 
  fetchStockAccounts, 
  getAccountBalance,
  ConnectedAccount, 
  AccountInfo,
  BalanceInfo,
  StockItem
} from '../../../api/connectedAccountApi';

// 증권사 데이터 매핑 임포트
import { findSecuritiesFirmByName } from '../../../data/organizationData';

// 환경 설정 임포트
import { FLASK_SERVER_URL } from '../../../constants/config';

// 스타일 임포트
import withTheme from '../../../hoc/withTheme';
import createStyles, { MyStockAccountComponentStylesType } from '../../../styles/components/myStockAccountComponent.styles';
// 공통 Theme 타입 가져오기
import { Theme } from '../../../types/theme';

// 계좌 정보 Context 임포트
import { useAccounts } from '../../../context/AccountsContext';

// 주식 데이터 인터페이스 정의
interface StockData {
  name: string;
  price: string;
  quantity: string;
  amount: string;
  availableQuantity: string;
  isForeign: boolean;
  currency: string;
  originalPrice?: string;
  originalAmount?: string;
}

// 비율과 색상이 추가된 주식 데이터 인터페이스
interface StockWithRatioAndColor extends StockData {
  ratio: number;
  color: string;
  valueUSD?: number;
  value: number;
}

// 확장된 주식 정보 인터페이스
interface EnhancedStockItem extends StockItem {
  currency: 'KRW' | 'USD'; // 통화 정보 추가
  isForeign: boolean;     // 해외주식 여부
}

// 컴포넌트 props 인터페이스 정의
interface MyStockAccountComponentProps {
  theme: Theme;
}

// 컴포넌트 정의
const MyStockAccountComponent = ({ theme }: MyStockAccountComponentProps): React.ReactElement => {
  const insets = useSafeAreaInsets();
  const styles: MyStockAccountComponentStylesType = createStyles(theme);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [stockAccounts, setStockAccounts] = useState<AccountInfo[]>([]);
  const [balanceInfo, setBalanceInfo] = useState<Record<string, BalanceInfo>>({});
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
  const [currencyType, setCurrencyType] = useState<'KRW' | 'USD'>('KRW');
  
  // 계좌 정보 Context 사용
  const { accounts: savedAccounts, addAccount: saveAccount, updateAccount } = useAccounts();
  
  // 비밀번호 입력 관련 상태
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [accountPassword, setAccountPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [accountToLoad, setAccountToLoad] = useState<{account: AccountInfo, connectedId: string} | null>(null);
  const [saveInProgress, setSaveInProgress] = useState(false);
  
  // 계좌별 비밀번호 상태 추적 추가
  const [accountPasswordStatus, setAccountPasswordStatus] = useState<{[key: string]: boolean}>({});
  
  // 로딩 상태 관리
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [loadingAccountNumber, setLoadingAccountNumber] = useState<string>('');
  
  // 고정 환율 (실제로는 API에서 가져와야 함)
  const exchangeRate = 1350; // 1 USD = 1350 KRW
  
  // 증권사 이름으로 기관코드 찾기 - RecordComponent와 동일한 로직
  const getOrganizationCode = (companyName: string): string => {
    console.log(`[기관코드 찾기] 입력된 회사명: "${companyName}"`);
    
    // 먼저 정확한 매칭 시도
    let firm = findSecuritiesFirmByName(companyName);
    
    if (!firm) {
      // 정확한 매칭이 안되면 더 유연한 매칭 시도
      console.log(`[기관코드 찾기] 정확한 매칭 실패, 유연한 매칭 시도`);
      
      // 삼성증권 관련 매칭
      if (companyName.includes('삼성') || companyName.toLowerCase().includes('samsung')) {
        console.log(`[기관코드 찾기] 삼성증권으로 인식: ${companyName}`);
        return '0240';
      }
      
      // NH투자증권 관련 매칭
      if (companyName.includes('NH') || companyName.includes('농협')) {
        console.log(`[기관코드 찾기] NH투자증권으로 인식: ${companyName}`);
        return '0247';
      }
      
      // 키움증권 관련 매칭
      if (companyName.includes('키움') || companyName.toLowerCase().includes('kiwoom')) {
        console.log(`[기관코드 찾기] 키움증권으로 인식: ${companyName}`);
        return '0264';
      }
      
      // 한국투자증권 관련 매칭
      if (companyName.includes('한국투자') || companyName.includes('한투')) {
        console.log(`[기관코드 찾기] 한국투자증권으로 인식: ${companyName}`);
        return '0243';
      }
      
      // 미래에셋 관련 매칭
      if (companyName.includes('미래에셋')) {
        console.log(`[기관코드 찾기] 미래에셋증권으로 인식: ${companyName}`);
        return '0238';
      }
    }
    
    if (firm) {
      console.log(`[기관코드 찾기] 증권사 ${companyName} -> 코드 ${firm.code} 변환 성공`);
      return firm.code;
    } else {
      console.warn(`[기관코드 찾기] 증권사 코드를 찾을 수 없음: "${companyName}", 기본값(삼성증권) 사용`);
      return '0240'; // 기본 코드 (삼성증권)
    }
  };

  // 계좌번호로 해당 계좌의 connectedId 찾기
  const findConnectedIdByAccountNumber = (accountNumber: string): string | undefined => {
    const account = connectedAccounts.find(acc => acc.accountNumber === accountNumber);
    return account?.connectedId;
  };
  
  // 로컬에 저장된 계좌 정보 찾기
  const findSavedAccount = (accountNumber: string, organization: string) => {
    return savedAccounts.find(acc => 
      acc.account === accountNumber && acc.organization === organization
    );
  };

  // 저장된 계좌 비밀번호 확인 (직접 AsyncStorage도 함께 확인)
  const checkSavedPassword = async (accountNumber: string, organization: string): Promise<boolean> => {
    // 1. AccountsContext에서 계좌 정보 찾기
    const savedAccount = findSavedAccount(accountNumber, organization);
    const hasContextPassword = !!(savedAccount && savedAccount.account_password);
    
    // 2. 직접 AsyncStorage에서도 확인
    let hasDirectPassword = false;
    try {
      const directPassword = await AsyncStorage.getItem(`direct_password_${accountNumber}`);
      hasDirectPassword = !!directPassword;
    } catch (err) {
      console.error('직접 저장소 확인 오류:', err);
    }
    
    console.log(`계좌 ${accountNumber} 비밀번호 확인 결과: Context=${hasContextPassword}, Direct=${hasDirectPassword}`);
    
    return hasContextPassword || hasDirectPassword;
  };

  // 계좌 선택 핸들러
  const handleAccountChange = (index: number) => {
    console.log(`계좌 선택: ${index}번째 계좌`);
    
    // 선택된 계좌의 인덱스 업데이트
    setSelectedAccountIndex(index);
    
    // 현재 선택된 계좌의 정보 가져오기
    const account = stockAccounts[index];
    
    // 계좌 인덱스에 따라 connectedId 매핑 - 인덱스 기반 매핑
    let connectedId = '';
    
    // 인덱스에 맞는 connectedId 사용
    if (connectedAccounts.length > index) {
      const connectedAccount = connectedAccounts[index];
      if (typeof connectedAccount === 'string') {
        connectedId = connectedAccount;
      } else if (typeof connectedAccount === 'object' && connectedAccount) {
        connectedId = connectedAccount.connectedId || '';
      }
    } else if (connectedAccounts.length > 0) {
      const firstAccount = connectedAccounts[0];
      if (typeof firstAccount === 'string') {
        connectedId = firstAccount;
      } else if (typeof firstAccount === 'object' && firstAccount) {
        connectedId = firstAccount.connectedId || '';
      }
    }
    
    // connectedId가 있으면 계좌 정보 설정
    if (connectedId) {
      setAccountToLoad({account, connectedId});
      
      // 증권사 코드 찾기
      const organizationCode = getOrganizationCode(account.company);
      
      // 저장된 계좌 정보 확인
      const savedAccount = findSavedAccount(account.accountNumber, organizationCode);
      
      if (savedAccount && savedAccount.account_password) {
        // 저장된 비밀번호가 있으면 바로 계좌 정보 조회
        console.log('저장된 계좌 비밀번호 사용');
        setIsLoadingBalance(true);
        setLoadingAccountNumber(account.accountNumber);
        
        loadAccountBalance(account, connectedId, savedAccount.account_password)
          .then(() => {
            console.log('저장된 비밀번호로 계좌 잔고 조회 완료');
          })
          .catch(error => {
            console.error('저장된 비밀번호로 계좌 조회 실패, 재입력 요청:', error);
            // 저장된 비밀번호로 조회 실패 시 비밀번호 입력 요청
            setAccountPassword("");
            setPasswordError("저장된 비밀번호가 유효하지 않습니다. 다시 입력해주세요.");
            setShowPasswordModal(true);
          })
          .finally(() => {
            setIsLoadingBalance(false);
            setLoadingAccountNumber('');
          });
      } else {
        // 저장된 비밀번호가 없으면 비밀번호 입력 요청
        setAccountPassword("");
        setPasswordError("");
        console.log('저장된 비밀번호 없음, 모달 표시');
        setShowPasswordModal(true);
      }
    } else {
      console.error('이용 가능한 connectedId가 없습니다.');
    }
  };
  
  // 비밀번호 확인 버튼 핸들러
  const handlePasswordConfirm = async () => {
    if (!accountToLoad || !accountPassword) {
      setPasswordError('계좌 비밀번호를 입력해주세요.');
      return;
    }
    
    try {
      setSaveInProgress(true);
      setIsLoadingBalance(true);
      setLoadingAccountNumber(accountToLoad.account.accountNumber);
      setPasswordError('');
      
      const organization = getOrganizationCode(accountToLoad.account.company);
      const accountNumber = accountToLoad.account.accountNumber;
      const connectedId = accountToLoad.connectedId;
      
      // organization 값이 숫자로만 구성되어 있는지 검증
      if (!/^\d+$/.test(organization)) {
        console.error('[계좌 비밀번호 저장] 잘못된 기관코드 형식:', organization);
        throw new Error(`잘못된 기관코드 형식입니다: ${organization}`);
      }
      
      console.log('[계좌 비밀번호 저장] 회사명:', accountToLoad.account.company);
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
        const response = await loadAccountBalance(
          accountToLoad.account, 
          accountToLoad.connectedId, 
          accountPassword
        );
        
        if (response) {
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
          
          // 비밀번호 상태 업데이트
          setAccountPasswordStatus(prev => ({
            ...prev,
            [accountNumber]: true
          }));
          
          // 모달 닫기
          setShowPasswordModal(false);
          setAccountPassword('');
          setPasswordError('');
          
          console.log('계좌 잔고 조회 완료 및 계좌 정보 저장');
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
      setIsLoadingBalance(false);
      setLoadingAccountNumber('');
    }
  };
  
  // 비밀번호 취소 버튼 핸들러
  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
  };
  
  // 통화 변경 핸들러
  const handleCurrencyChange = (type: 'KRW' | 'USD') => {
    setCurrencyType(type);
  };
  
  // 금액 형식화 함수
  const formatCurrency = (value: number, currencyType: 'KRW' | 'USD'): string => {
    if (currencyType === 'USD') {
      return `$${(value / exchangeRate).toFixed(2)}`;
    } else {
      return `${value.toLocaleString()}원`;
    }
  };

  // API에서 커넥티드 계좌 정보 가져오기
  useEffect(() => {
    // 연결된 계좌 ID 정보 가져오기
    const getConnectedAccounts = async () => {
      try {
        setIsLoadingAccounts(true);
        
        // API에서 자체적으로 토큰을 가져오기 때문에 토큰을 전달할 필요가 없음
        const accounts = await fetchConnectedAccounts();
        
        console.log('Connected Accounts:', accounts);
        setConnectedAccounts(accounts);
        
        // 계좌 정보 조회도 같이 실행
        getStockAccounts(accounts);
      } catch (error) {
        console.error('계좌 연결 ID 조회 실패:', error);
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    // 증권 계좌 정보 가져오기
    const getStockAccounts = async (connectedAccountsList: ConnectedAccount[]) => {
      try {
        const accounts = await fetchStockAccounts();
        
        console.log('=== 자산 페이지 계좌 API 응답 상세 로깅 ===');
        console.log('원본 응답 데이터:', JSON.stringify(accounts, null, 2));
        
        // 각 계좌별로 필드 확인
        accounts.forEach((account: any, index: number) => {
          console.log(`계좌 ${index + 1}:`, {
            company: account.company,
            accountNumber: account.accountNumber,
            principal: account.principal,
            principalExists: 'principal' in account,
            principalType: typeof account.principal,
            returnRate: account.returnRate,
            allFields: Object.keys(account)
          });
        });
        
        setStockAccounts(accounts);
      } catch (error) {
        console.error('증권 계좌 정보 조회 실패:', error);
      }
    };

    getConnectedAccounts();
    
    return () => {
      console.log('컴포넌트 언마운트');
    };
  }, []);
  
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
            
            let connectedId = '';
            if (connectedAccounts.length > i) {
              const connectedAccount = connectedAccounts[i];
              if (typeof connectedAccount === 'string') {
                connectedId = connectedAccount;
              } else if (typeof connectedAccount === 'object' && connectedAccount) {
                connectedId = connectedAccount.connectedId || '';
              }
            } else if (connectedAccounts.length > 0) {
              const firstAccount = connectedAccounts[0];
              if (typeof firstAccount === 'string') {
                connectedId = firstAccount;
              } else if (typeof firstAccount === 'object' && firstAccount) {
                connectedId = firstAccount.connectedId || '';
              }
            }
            
            if (connectedId) {
              setAccountToLoad({account, connectedId});
              setSelectedAccountIndex(i);
              setIsLoadingBalance(true);
              setLoadingAccountNumber(account.accountNumber);
              
              // 저장된 비밀번호 가져오기
              const savedAccount = findSavedAccount(account.accountNumber, organizationCode);
              let password = '';
              
              if (savedAccount && savedAccount.account_password) {
                password = savedAccount.account_password;
              } else {
                try {
                  const directPassword = await AsyncStorage.getItem(`direct_password_${account.accountNumber}`);
                  password = directPassword || '';
                } catch (err) {
                  console.error('직접 저장소에서 비밀번호 가져오기 오류:', err);
                }
              }
              
              if (password) {
                try {
                  await loadAccountBalance(account, connectedId, password);
                  console.log('저장된 비밀번호로 계좌 잔고 조회 완료');
                } catch (error) {
                  console.error('저장된 비밀번호로 계좌 조회 실패:', error);
                } finally {
                  setIsLoadingBalance(false);
                  setLoadingAccountNumber('');
                }
              } else {
                setIsLoadingBalance(false);
                setLoadingAccountNumber('');
              }
            }
          } else if (!hasPassword && i === 0) {
            // 첫 번째 계좌에 저장된 비밀번호가 없으면 모달 표시
            console.log(`계좌 ${account.accountNumber}: 저장된 비밀번호 없음, 모달 표시`);
            
            let connectedId = '';
            if (connectedAccounts.length > i) {
              const connectedAccount = connectedAccounts[i];
              if (typeof connectedAccount === 'string') {
                connectedId = connectedAccount;
              } else if (typeof connectedAccount === 'object' && connectedAccount) {
                connectedId = connectedAccount.connectedId || '';
              }
            } else if (connectedAccounts.length > 0) {
              const firstAccount = connectedAccounts[0];
              if (typeof firstAccount === 'string') {
                connectedId = firstAccount;
              } else if (typeof firstAccount === 'object' && firstAccount) {
                connectedId = firstAccount.connectedId || '';
              }
            }
            
            if (connectedId) {
              setAccountToLoad({account, connectedId});
              setSelectedAccountIndex(i);
              setAccountPassword('');
              setPasswordError('');
              
              setTimeout(() => {
                setShowPasswordModal(true);
              }, 800);
            }
          }
        }
        
        // 모든 계좌의 비밀번호 상태 업데이트
        setAccountPasswordStatus(passwordStatusUpdates);
      }
    };

    loadAllAccountPasswords();
  }, [stockAccounts, connectedAccounts, savedAccounts]);
  
  // 모달 상태 변경 감지용 이펙트
  useEffect(() => {
    console.log(`모달 상태 변경: ${showPasswordModal ? '표시' : '숨김'}`);
  }, [showPasswordModal]);
  
  // 계좌 잔고 정보 가져오기
  const loadAccountBalance = async (account: AccountInfo, connectedId: string, password: string) => {
    try {
      // 증권사 이름으로 organization 코드 변환 - RecordComponent와 동일한 방식
      const organization = getOrganizationCode(account.company);
      const accountNumber = account.accountNumber;

      console.log(`${account.company} (${accountNumber}) 계좌의 잔고를 조회합니다.`);
      console.log('잔고 조회 요청:', {
        connectedId,
        organization,
        accountNumber,
        password: '******' // 보안을 위해 마스킹
      });
      
      // RecordComponent와 완전히 동일한 방식으로 API 호출
      const response = await getAccountBalance({
        organization,
        connectedId,
        account: accountNumber,
        account_password: password
      });

      console.log('잔고 조회 응답:', response.data);
      
      // API 응답 구조 자세히 로깅 (필드명 확인용)
      console.log('API 응답 상세 구조:', JSON.stringify(response.data.data, null, 2));
      
      // 응답 처리
      if (response.data.result.code === 'CF-00000') {
        const apiData = response.data.data;
        let stocks: EnhancedStockItem[] = [];
        
        // 종목 상세 정보 로깅
        if (apiData.resItemList && apiData.resItemList.length > 0) {
          console.log('첫 번째 종목 데이터:', JSON.stringify(apiData.resItemList[0], null, 2));
        }
        
        // resItemList가 있는 경우 (NH투자증권 형식)
        if (apiData.resItemList) {
          stocks = (apiData.resItemList || []).map((item: any) => {
            // 모든 필드를 로깅하여 어떤 필드가 있는지 확인
            console.log(`종목 정보 필드:`, Object.keys(item));
            
            // API 응답에서 확인된 정확한 필드명 사용
            const itemName = item.resItemName || '알 수 없음';
            const itemPrice = item.resPresentAmt || '0';
            const itemQuantity = item.resQuantity || '0';
            const itemAmount = item.resValuationAmt || '0';
              
            // 해외 주식인 경우 확인 (resAccountCurrency 필드 활용)
            const isForeign = 
              item.resAccountCurrency === 'USD' || 
              item.resNation === 'USA' || 
              item.resNation === 'US' || 
              (item.resMarket && ['NASDAQ', 'NYSE', 'AMEX'].includes(item.resMarket));
              
            // 통화 정보 (resAccountCurrency 필드 활용)
            const currency = item.resAccountCurrency === 'USD' ? 'USD' : 'KRW';
              
            // 해외 주식일 경우 원화로 변환된 가격 계산
            const convertedPrice = currency === 'USD' ? 
              (parseFloat(itemPrice) * exchangeRate).toString() : 
              itemPrice;
            const convertedAmount = currency === 'USD' ? 
              (parseFloat(itemAmount) * exchangeRate).toString() : 
              itemAmount;
              
            console.log(`종목 데이터 매핑:`, {
              name: itemName,
              price: convertedPrice,
              quantity: itemQuantity,
              amount: convertedAmount,
              isForeign: isForeign,
              currency: currency,
              originalPrice: currency === 'USD' ? itemPrice : undefined,
              originalAmount: currency === 'USD' ? itemAmount : undefined
            });
            
            return {
              name: itemName,
              price: convertedPrice,
              quantity: itemQuantity,
              amount: convertedAmount,
              availableQuantity: item.resQuantity || '0',
              isForeign: isForeign,
              currency: currency,
              originalPrice: currency === 'USD' ? itemPrice : undefined,
              originalAmount: currency === 'USD' ? itemAmount : undefined
            };
          });
        } 
        // 삼성증권 등 다른 형식의 경우 - resAccountStock이 있으면 변환
        else if (apiData.resAccountStock && Array.isArray(apiData.resAccountStock)) {
          stocks = apiData.resAccountStock.map((item: any) => {
            // 해외주식 여부 확인 (marketCode, nation 등의 필드 확인)
            const isForeign = 
              item.marketCode === 'NYSE' || 
              item.marketCode === 'NASDAQ' || 
              item.nation === 'USA' || 
              item.nation === 'US';
              
            return {
              name: item.name || item.stockName || item.stock_name || '알 수 없음',
              price: item.price || item.current_price || '0',
              quantity: item.quantity || item.qty || item.stock_qty || '0',
              amount: item.amount || item.valuation_amount || '0',
              availableQuantity: item.availableQuantity || item.available_qty || item.quantity || '0',
              isForeign: isForeign,
              currency: isForeign ? 'USD' : 'KRW'
            };
          });
        }
        
        // 공통 형식으로 정리
        const balance = {
          accountNumber: apiData.resAccount || accountNumber,
          accountName: apiData.resAccount || apiData.resAccountName || accountNumber,
          totalAmount: apiData.rsTotAmt || apiData.rsTotValAmt || apiData.resAccountTotalAmt || '0',
          balance: apiData.resDepositReceivedD2 || apiData.resDepositReceived || apiData.resAccountBalance || '0',
          stocks
        };
        
        // 총평가금액이 0이거나 없는 경우 직접 계산
        if (!balance.totalAmount || parseFloat(balance.totalAmount) === 0) {
          // 예수금
          const depositAmount = parseFloat(balance.balance || '0');
          
          // 보유종목 평가금액 합계
          const stocksValue = stocks.reduce((total, stock) => {
            return total + parseFloat(stock.amount || '0');
          }, 0);
          
          // 총평가금액 = 예수금 + 보유종목 평가금액
          balance.totalAmount = (depositAmount + stocksValue).toString();
          
          console.log(`[계산된 총평가금액] 예수금: ${depositAmount}, 보유종목: ${stocksValue}, 합계: ${balance.totalAmount}`);
        }
        
        console.log(`===== ${account.company} 계좌 잔고 정보 =====`);
        console.log('계좌번호:', accountNumber);
        console.log('계좌명:', balance.accountName);
        console.log('총평가금액:', balance.totalAmount);
        console.log('예수금:', balance.balance);
        console.log('보유종목 수:', balance.stocks?.length || 0);
        
        // 보유종목 상세 정보
        if (balance.stocks && balance.stocks.length > 0) {
          console.log(`\n===== ${account.company} 보유종목 상세 정보 =====`);
          balance.stocks.forEach((stock: EnhancedStockItem, index) => {
            console.log(`[${index + 1}] ${stock.name} (${stock.currency})`);
            console.log(`  - 현재가: ${stock.price}${stock.currency === 'USD' ? '달러' : '원'}`);
            console.log(`  - 보유수량: ${stock.quantity}주`);
            console.log(`  - 평가금액: ${stock.amount}${stock.currency === 'USD' ? '달러' : '원'}`);
            console.log(`  - 거래가능수량: ${stock.availableQuantity}주`);
            console.log('-------------------');
          });
        }
        
        // 기존 잔고 정보에 추가
        setBalanceInfo(prev => ({
          ...prev,
          [accountNumber]: balance
        }));
        
        return balance;
      } else {
        throw new Error(response.data.result.message || '잔고 조회 실패');
      }
    } catch (error: any) {
      console.error(`${account.company} 계좌 잔고 조회 실패:`, error);
      
      // 오류 메시지 개선
      const errorMessage = 
        error.response?.data?.result?.message || 
        error.message || 
        '계좌 잔고 조회에 실패했습니다. 비밀번호를 확인해주세요.';
      
      throw new Error(errorMessage);
    }
  };
  
  // 현재 선택된 계좌 정보 가져오기
  const selectedAccount = stockAccounts[selectedAccountIndex];
  
  // 선택된 계좌의 잔고 정보 가져오기
  const selectedBalanceInfo = selectedAccount ? balanceInfo[selectedAccount.accountNumber] : null;
  
  // 총 자산 가치 계산을 위한 변수 추가
  const totalValue = useMemo(() => {
    if (!selectedBalanceInfo) return 0;
    return parseFloat(selectedBalanceInfo.totalAmount || '0');
  }, [selectedBalanceInfo]);

  const totalValueUSD = useMemo(() => {
    return totalValue / exchangeRate;
  }, [totalValue]);
  
  // 선택된 계좌의 종목 데이터 가져오기 (차트용)
  const getStockDataForChart = (): StockWithRatioAndColor[] => {
    if (!selectedAccount || !selectedBalanceInfo || !selectedBalanceInfo.stocks) {
      // 더미 데이터 대신 빈 배열 반환
      return [];
    }
    
    const stocks = selectedBalanceInfo.stocks as EnhancedStockItem[];
    let stockData: StockData[] = stocks.map(stock => {
      const stockValue = stock.currency === 'USD' 
        ? parseFloat(stock.amount) * exchangeRate
        : parseFloat(stock.amount);
      
      return {
        name: stock.name,
        price: stock.price,
        quantity: stock.quantity,
        amount: stock.amount,
        availableQuantity: stock.availableQuantity,
        isForeign: stock.isForeign,
        currency: stock.currency,
        originalPrice: stock.originalPrice,
        originalAmount: stock.originalAmount
      };
    });
    
    // 원화 현금 자산 추가 (예수금)
    if (selectedBalanceInfo.balance && parseFloat(selectedBalanceInfo.balance) > 0) {
      stockData.push({
        name: '원화 현금 (예수금)',
        price: '0',
        quantity: '0',
        amount: selectedBalanceInfo.balance,
        availableQuantity: '0',
        isForeign: false,
        currency: 'KRW',
        originalPrice: undefined,
        originalAmount: undefined
      });
    }
    
    // 외화 현금 자산 추가 (USD) - 실제 앱에서는 외화 예수금 정보를 API에서 가져와야 함
    // 예시 코드: API에서 외화 예수금 정보가 별도로 제공된다면 그 값을 사용하세요
    const usdBalance = selectedBalanceInfo.usdBalance || '0'; // 예: API 응답에 usdBalance 필드가 있다면
    if (parseFloat(usdBalance) > 0) {
      stockData.push({
        name: '달러 현금 (USD)',
        price: '0',
        quantity: '0',
        amount: (parseFloat(usdBalance) * exchangeRate).toString(), // 원화로 환산
        availableQuantity: '0',
        isForeign: true,
        currency: 'USD',
        originalPrice: undefined,
        originalAmount: usdBalance // 원본 달러 금액
      });
    }
    
    // 총 자산 가치 계산 (원화 기준)
    const totalValue: number = stockData.reduce((total, stock) => total + parseFloat(stock.amount), 0);
  
    // 색상 배열 정의
    const colors: string[] = [
      theme.colors.primary, // 토스 메인 파란색
      '#FF6B35',  // 주황
      '#4CAF50',  // 녹색
      '#9C27B0',  // 보라
      '#FF9800',  // 주황색
      '#00BCD4',  // 청록색
      '#E91E63',  // 분홍색
      '#FFEB3B',  // 노란색
      '#607D8B',  // 파란회색
      '#8BC34A',  // 연두색
    ];
    
    // 특별 색상 지정 (현금은 고유한 색상으로 표시)
    const specialColors: Record<string, string> = {
      '원화 현금 (예수금)': '#3DB9D3', // 하늘색
      '달러 현금 (USD)': '#5E44FF', // 보라색
    };
    
    // 비율 계산과 내림차순 정렬 및 색상 적용
    return stockData
      .map(stock => ({
        ...stock,
        value: parseFloat(stock.amount),
        ratio: parseFloat(((parseFloat(stock.amount) / totalValue) * 100).toFixed(1)),
        valueUSD: stock.currency === 'USD' ? parseFloat(stock.originalAmount || stock.amount) : undefined
      }))
      .sort((a, b) => b.ratio - a.ratio)
      .map((stock, index) => ({
        ...stock,
        color: specialColors[stock.name] || (index < 10 ? colors[index] : theme.colors.placeholder)
      }));
  };
  
  // 차트 데이터 가져오기
  const stocksWithRatioAndColor: StockWithRatioAndColor[] = getStockDataForChart();
  
  return (
    <View style={styles.container}>
      <ScrollView 
        style={{flex: 1}}
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
      >
        {/* 계좌 선택 버튼 영역 */}
        <View style={styles.accountSelectorContainer}>
          <AccountSelectorComponent 
            theme={theme}
            accounts={stockAccounts.length > 0 ? stockAccounts : []}
            selectedAccountIndex={selectedAccountIndex < stockAccounts.length ? selectedAccountIndex : 0}
            onAccountChange={handleAccountChange}
            isLoading={isLoadingAccounts}
          />
          
          {/* 비밀번호 입력 버튼 */}
          {stockAccounts.length > 0 && selectedAccountIndex < stockAccounts.length && 
           !accountPasswordStatus[stockAccounts[selectedAccountIndex]?.accountNumber] && (
            <TouchableOpacity
              style={{marginTop: 8, padding: 8, backgroundColor: theme.colors.primary, borderRadius: 8, alignSelf: 'center'}}
              onPress={() => {
                const account = stockAccounts[selectedAccountIndex];
                let connectedId = '';
                
                if (connectedAccounts.length > selectedAccountIndex) {
                  const connectedAccount = connectedAccounts[selectedAccountIndex];
                  if (typeof connectedAccount === 'string') {
                    connectedId = connectedAccount;
                  } else if (typeof connectedAccount === 'object' && connectedAccount) {
                    connectedId = connectedAccount.connectedId || '';
                  }
                } else if (connectedAccounts.length > 0) {
                  const firstAccount = connectedAccounts[0];
                  if (typeof firstAccount === 'string') {
                    connectedId = firstAccount;
                  } else if (typeof firstAccount === 'object' && firstAccount) {
                    connectedId = firstAccount.connectedId || '';
                  }
                }
                
                if (connectedId) {
                  setAccountToLoad({account, connectedId});
                  setAccountPassword('');
                  setPasswordError('');
                  setShowPasswordModal(true);
                } else {
                  Alert.alert('오류', '연결된 계좌 정보를 찾을 수 없습니다.');
                }
              }}
              disabled={isLoadingBalance}
            >
              <Text style={{color: theme.colors.card, fontSize: 12}}>
                {isLoadingBalance && loadingAccountNumber === stockAccounts[selectedAccountIndex]?.accountNumber ? 
                  '조회 중...' : '계좌 비밀번호 입력'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* 통화 선택 버튼 영역 */}
        <View style={[styles.currencySelectorContainer, { justifyContent: 'flex-end', marginTop: 2, marginRight: 2 }]}>
          <CurrencyToggle
            theme={theme}
            currencyType={currencyType === 'KRW' ? 'won' : 'dollar'}
            onCurrencyChange={(type) => handleCurrencyChange(type === 'won' ? 'KRW' : 'USD')}
          />
        </View>
        
        {/* 요약 정보 영역 */}
        <View style={styles.summaryContainer}>
          <Text style={styles.smallTitle}>총 보유자산</Text>
          <Text style={styles.totalValue}>
            {currencyType === 'KRW' ? 
              `${totalValue.toLocaleString()}원` : 
              `$${totalValueUSD.toFixed(2)}`
            }
          </Text>
        </View>
        
        {/* 원형 차트 영역 */}
        <View style={styles.chartContainer}>
          <CircularGraphComponent data={stocksWithRatioAndColor} />
        </View>
        
        {/* 종목 리스트 헤더 */}
        <View style={styles.stockListHeader}>
          <Text style={styles.sectionTitle}>보유종목 {stocksWithRatioAndColor.length}</Text>
        </View>
        
        {/* 보유 종목 리스트 - 통화 형식에 맞게 표시 */}
        <View style={styles.stockList}>
          {stocksWithRatioAndColor
            .filter(stock => parseFloat(stock.amount) > 0)
            .map((stock, index) => (
              <View key={index} style={styles.stockItemContainer}>
                <View style={[styles.colorIndicator, { backgroundColor: stock.color }]} />
                <View style={styles.stockInfo}>
                  <Text style={styles.stockName}>{stock.name}</Text>
                  <Text style={styles.stockValue}>
                    {currencyType === 'KRW' ? 
                      (stock.currency === 'USD' ? 
                        `${parseFloat(stock.amount).toLocaleString()}원` : 
                        `${parseFloat(stock.amount).toLocaleString()}원`) : 
                      (stock.currency === 'USD' ? 
                        `$${Number(stock.originalAmount || (parseFloat(stock.amount) / exchangeRate)).toFixed(2)}` : 
                        `$${Number(parseFloat(stock.amount) / exchangeRate).toFixed(2)}`)
                    }
                  </Text>
                </View>
                <Text style={styles.stockRatio}>{stock.ratio}%</Text>
              </View>
            ))}
        </View>
      </ScrollView>

      {/* 로딩 오버레이 - ScrollView 밖으로 이동 */}
      {(isLoadingAccounts || isLoadingBalance) && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>
              {isLoadingAccounts ? '계좌 정보 로딩 중...' : 
               isLoadingBalance ? '잔고 조회 중...' : 
               '로딩 중...'}
            </Text>
          </View>
        </View>
      )}
      
      {/* 계좌 비밀번호 모달 - 공통 컴포넌트 사용 */}
      <AccountPasswordModal
        theme={theme}
        visible={showPasswordModal}
        account={accountToLoad ? 
          {
            company: accountToLoad.account.company,
            accountNumber: accountToLoad.account.accountNumber
          } : null}
        password={accountPassword}
        onChangePassword={setAccountPassword}
        onConfirm={handlePasswordConfirm}
        onCancel={handlePasswordCancel}
        isLoading={saveInProgress}
        errorMessage={passwordError}
      />
    </View>
  );
};

// MemoizedComponent 선언을 파일 맨 아래로 이동
const MemoizedComponent = React.memo(MyStockAccountComponent);
MemoizedComponent.displayName = 'MyStockAccountComponent';

// 최상위 레벨에서 export
export default withTheme(MemoizedComponent);
