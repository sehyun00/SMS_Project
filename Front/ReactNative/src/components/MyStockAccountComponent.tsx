// 파일 경로: src/components/MyStockAccountComponent.tsx
// 컴포넌트 흐름: App.js > AppNavigator.js > MainPage.jsx > MyStockAccountComponent.tsx

import React, { useEffect, useState, ReactElement, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 컴포넌트 임포트
import CircularGraphComponent from './common/CircularGraphComponent';
import IndividualStockComponent from './common/IndividualStockComponent';
import AccountPasswordModal from './common/AccountPasswordModal';
import AccountSelectorComponent from './AccountSelectorComponent';

// API 임포트
import { 
  fetchConnectedAccounts, 
  fetchStockAccounts, 
  getStockBalance,
  ConnectedAccount, 
  AccountInfo,
  BalanceInfo,
  StockItem
} from '../api/connectedAccountApi';

// 증권사 데이터 매핑 임포트
import { findSecuritiesFirmByName } from '../data/organizationData';

// 환경 설정 임포트
import { FLASK_SERVER_URL } from '../constants/config';

// 스타일 임포트
import withTheme from '../hoc/withTheme';
import createStyles, { MyStockAccountComponentStylesType } from '../styles/components/myStockAccountComponent.styles';
// 공통 Theme 타입 가져오기
import { Theme } from '../types/theme';

// 계좌 정보 Context 임포트
import { useAccounts } from '../context/AccountsContext';

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
  
  // 고정 환율 (실제로는 API에서 가져와야 함)
  const exchangeRate = 1350; // 1 USD = 1350 KRW
  
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
  const checkSavedPassword = async (accountNumber: string, organization: string) => {
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
    if (connectedAccounts.length > index && typeof connectedAccounts[index] === 'string') {
      // 계좌 순서와 동일한 connectedId 인덱스 사용
      connectedId = connectedAccounts[index]; 
      console.log(`${index}번째 계좌에 ${index}번째 connectedId 연결: ${connectedId}`);
    } else {
      // 만약 인덱스에 맞는 connectedId가 없으면 기존 로직 사용
      const matchingConnectedAccount = connectedAccounts.find(acc => acc.accountNumber === account.accountNumber);
      
      if (matchingConnectedAccount) {
        connectedId = matchingConnectedAccount.connectedId;
        console.log(`계좌 ${account.accountNumber}와 connectedId ${connectedId} 매칭됨`);
      } else if (connectedAccounts.length > 0) {
        // 매칭되는 계좌가 없으면 첫 번째 connectedId 사용 (긴급 대체)
        if (typeof connectedAccounts[0] === 'string') {
          connectedId = connectedAccounts[0];
        } else if (typeof connectedAccounts[0] === 'object') {
          connectedId = connectedAccounts[0].connectedId || '';
        }
        console.log(`계좌 ${account.accountNumber}에 매칭되는 connectedId 없음, 긴급 대체: ${connectedId}`);
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
        getAccountBalance(account, connectedId, savedAccount.account_password)
          .then(() => {
            console.log('저장된 비밀번호로 계좌 잔고 조회 완료');
          })
          .catch(error => {
            console.error('저장된 비밀번호로 계좌 조회 실패, 재입력 요청:', error);
            // 저장된 비밀번호로 조회 실패 시 비밀번호 입력 요청
            setAccountPassword("");
            setPasswordError("저장된 비밀번호가 유효하지 않습니다. 다시 입력해주세요.");
            setShowPasswordModal(true);
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
    if (!accountPassword.trim()) {
      setPasswordError("비밀번호를 입력해주세요.");
      return;
    }
    
    if (accountPassword.length < 4) {
      setPasswordError("비밀번호는 최소 4자리 이상이어야 합니다.");
      return;
    }
    
    // 비밀번호가 유효하면 모달 닫기
    setShowPasswordModal(false);
    
    try {
      console.log('계좌 잔고 조회 시작...');
      
      // 선택된 계좌 인덱스 업데이트
      const index = stockAccounts.findIndex(acc => acc.accountNumber === accountToLoad?.account.accountNumber);
      if (index !== -1) {
        setSelectedAccountIndex(index);
      }
      
      // 계좌 잔고 정보 조회 - Flask API를 통해 특정 계좌만 조회
      if (accountToLoad) {
        // 로딩 상태 표시 가능 (필요시 상태 추가)
        
        // 플라스크 API를 통해 해당 계좌의 잔고 조회
        await getAccountBalance(
          accountToLoad.account, 
          accountToLoad.connectedId, 
          accountPassword
        );
        
        // 성공적으로 조회했다면 계좌 정보 저장
        const organizationCode = getOrganizationCode(accountToLoad.account.company);
        
        // 계좌 정보 생성
        const accountInfo = {
          account: accountToLoad.account.accountNumber,
          account_password: accountPassword,
          connectedId: accountToLoad.connectedId,
          organization: organizationCode
        };
        
        // 이미 저장된 계좌인지 확인
        const existingAccount = findSavedAccount(accountToLoad.account.accountNumber, organizationCode);
        
        // 계좌 정보 저장 - 기존 계좌면 update, 없으면 add
        if (existingAccount) {
          console.log(`기존 계좌 정보 업데이트: ${accountToLoad.account.accountNumber}`);
          const result = await updateAccount(accountInfo);
          if (!result) {
            console.error('계좌 정보 업데이트 실패');
          }
        } else {
          console.log(`새 계좌 정보 저장: ${accountToLoad.account.accountNumber}`);
          const result = await saveAccount(accountInfo);
          if (!result) {
            console.error('계좌 정보 저장 실패');
          }
        }
        
        // 확인을 위해 저장 후 계좌 정보 다시 조회
        const savedAgain = findSavedAccount(accountToLoad.account.accountNumber, organizationCode);
        console.log(`계좌 ${accountToLoad.account.accountNumber}의 비밀번호 저장 확인:`, savedAgain ? '성공' : '실패');
        
        // 추가로 AsyncStorage에 직접 저장 (이중 보장)
        try {
          await AsyncStorage.setItem(`direct_password_${accountToLoad.account.accountNumber}`, accountPassword);
          console.log(`계좌 ${accountToLoad.account.accountNumber}의 비밀번호 직접 저장 완료`);
        } catch (err) {
          console.error('직접 저장 오류:', err);
        }
        
        console.log('계좌 잔고 조회 완료 및 계좌 정보 저장');
      }
    } catch (error: any) {
      console.error('계좌 잔고 조회 실패:', error);
      
      // 에러 발생 시 다시 비밀번호 입력 모달 표시
      setPasswordError(error.message || '계좌 정보 조회에 실패했습니다. 비밀번호를 확인해주세요.');
      setTimeout(() => {
        setShowPasswordModal(true);  
      }, 500);
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
    const getStockAccounts = async (connectedAccountsList: ConnectedAccount[]) => {
      try {
        const accounts = await fetchStockAccounts();
        
        console.log('Stock Accounts:', accounts);
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
  
  // 모달 상태 변경 감지용 이펙트
  useEffect(() => {
    console.log(`모달 상태 변경: ${showPasswordModal ? '표시' : '숨김'}`);
  }, [showPasswordModal]);
  
  // 컴포넌트 마운트 시 모달 표시하는 이펙트 (추가)
  useEffect(() => {
    // 모든 데이터가 로드된 후에 모달 표시
    if (stockAccounts.length > 0 && connectedAccounts.length > 0) {
      console.log('데이터 로드 완료, 초기 모달 표시 준비');
      
      // 첫 번째 계좌 선택
      const account = stockAccounts[0];
      const index = 0; // 첫 번째 계좌 인덱스
      setSelectedAccountIndex(index);
      
      // 인덱스 기반 connectedId 매핑
      let connectedId = '';
      
      // 인덱스에 맞는 connectedId 사용
      if (connectedAccounts.length > index && typeof connectedAccounts[index] === 'string') {
        // 계좌 순서와 동일한 connectedId 인덱스 사용
        connectedId = connectedAccounts[index]; 
        console.log(`초기 로드: ${index}번째 계좌에 ${index}번째 connectedId 연결: ${connectedId}`);
      } else {
        // 문자열 배열인 경우
        if (typeof connectedAccounts[0] === 'string') {
          connectedId = connectedAccounts[0];
        } 
        // 객체 배열인 경우
        else if (typeof connectedAccounts[0] === 'object' && connectedAccounts[0] !== null) {
          connectedId = connectedAccounts[0].connectedId || '';
        }
        console.log(`초기 로드: 인덱스 기준 매핑 실패, 첫 번째 connectedId 사용: ${connectedId}`);
      }
      
      console.log(`초기 계좌: ${account.accountNumber}, connectedId: ${connectedId}`);
      
      // 계좌 정보 설정
      setAccountToLoad({account, connectedId});
      
      // 비밀번호 초기화
      setAccountPassword("");
      setPasswordError("");
      
      // 증권사 코드 찾기
      const organizationCode = getOrganizationCode(account.company);
      
      // 비밀번호 확인 (직접 저장소도 함께 확인)
      checkSavedPassword(account.accountNumber, organizationCode).then(hasPassword => {
        if (hasPassword) {
          // 저장된 비밀번호가 있으면 자동으로 계좌 정보 조회
          console.log('저장된 계좌 비밀번호로 자동 조회 시도');
          
          // 비밀번호 가져오기 (Context 혹은 직접 저장소)
          const getPassword = async () => {
            // Context에서 먼저 확인
            const savedAccount = findSavedAccount(account.accountNumber, organizationCode);
            if (savedAccount && savedAccount.account_password) {
              return savedAccount.account_password;
            }
            
            // 직접 저장소에서 확인
            try {
              return await AsyncStorage.getItem(`direct_password_${account.accountNumber}`);
            } catch (err) {
              console.error('직접 저장소에서 비밀번호 가져오기 오류:', err);
              return null;
            }
          };
          
          getPassword().then(password => {
            if (password) {
              getAccountBalance(account, connectedId, password)
                .then(() => {
                  console.log('저장된 비밀번호로 계좌 잔고 조회 완료');
                })
                .catch(error => {
                  console.error('저장된 비밀번호로 계좌 조회 실패, 재입력 요청:', error);
                  // 저장된 비밀번호로 조회 실패 시 비밀번호 입력 요청
                  setShowPasswordModal(true);
                });
            } else {
              // 비밀번호를 찾을 수 없는 경우
              console.log('비밀번호를 가져올 수 없음, 모달 표시');
              setShowPasswordModal(true);
            }
          });
        } else {
          // 저장된 비밀번호가 없으면 모달 표시
          setTimeout(() => {
            console.log('저장된 비밀번호 없음, 초기 모달 자동 표시');
            setShowPasswordModal(true);
          }, 800);
        }
      });
    }
  }, [stockAccounts, connectedAccounts, savedAccounts]); // 계좌 정보와 저장된 계좌 정보가 바뀌면 실행
  
  // 계좌 잔고 정보 가져오기
  const getAccountBalance = async (account: AccountInfo, connectedId: string, password: string) => {
    try {
      // 증권사 이름으로 organization 코드 변환 (ConnectedAccountComponent 방식과 동일하게)
      const firmInfo = findSecuritiesFirmByName(account.company);
      if (!firmInfo) {
        throw new Error(`증권사 ${account.company}에 대한 코드를 찾을 수 없습니다.`);
      }
      
      const organization = firmInfo.code; // 증권사 코드
      const accountNumber = account.accountNumber;

      console.log(`${account.company} (${accountNumber}) 계좌의 잔고를 조회합니다.`);
      console.log('잔고 조회 요청:', {
        connectedId,
        organization,
        accountNumber,
        password: '******' // 보안을 위해 마스킹
      });
      
      // Flask API 호출을 위한 페이로드 구성
      const apiPayload = {
        connectedId,
        organization,
        account: accountNumber,
        account_password: password
      };

      console.log('계좌 비밀번호 확인 (마스킹):', '****');  // 보안을 위해 마스킹
      
      // API 호출에 사용되는 organization 코드 로깅
      console.log(`API 호출에 사용되는 organization 코드: ${organization}`);
      
      // 로그용 마스킹된 페이로드
      console.log(`잔고 조회 실제 API 요청 페이로드:`, { 
        ...apiPayload, 
        account_password: '******' // 로그에서는 마스킹 처리
      });
      
      // 실제 API 호출
      const response = await axios.post(`${FLASK_SERVER_URL}/stock/balance`, apiPayload, {
        headers: {
          'Content-Type': 'application/json',
        }
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
          balance: apiData.resDepositReceived || apiData.resAccountBalance || '0',
          stocks
        };
        
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
    <ScrollView 
      style={styles.container}
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
          isLoading={false}
        />
      </View>
      
      {/* 통화 선택 버튼 영역 */}
      <View style={styles.currencySelectorContainer}>
        <TouchableOpacity
          style={[
            styles.currencyButton,
            currencyType === 'KRW' ? styles.selectedCurrencyButton : null
          ]}
          onPress={() => handleCurrencyChange('KRW')}
        >
          <Text style={
            currencyType === 'KRW' ? styles.selectedCurrencyText : styles.currencyText
          }>
            원화 (₩)
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.currencyButton,
            currencyType === 'USD' ? styles.selectedCurrencyButton : null
          ]}
          onPress={() => handleCurrencyChange('USD')}
        >
          <Text style={
            currencyType === 'USD' ? styles.selectedCurrencyText : styles.currencyText
          }>
            달러 ($)
          </Text>
        </TouchableOpacity>
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
        isLoading={false} // MyStockAccountComponent에서는 별도의 로딩 상태 변수가 없어서 false 사용
        errorMessage={passwordError}
      />
    </ScrollView>
  );
};

// MemoizedComponent 선언을 파일 맨 아래로 이동
const MemoizedComponent = React.memo(MyStockAccountComponent);
MemoizedComponent.displayName = 'MyStockAccountComponent';

// 최상위 레벨에서 export
export default withTheme(MemoizedComponent);
