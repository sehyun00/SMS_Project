import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 계좌 정보 인터페이스
export interface AccountInfo {
  account: string;
  account_password: string;
  connectedId: string;
  organization: string;
}

// Context 인터페이스
interface AccountsContextType {
  accounts: AccountInfo[];
  loading: boolean;
  addAccount: (account: AccountInfo) => Promise<boolean>;
  removeAccount: (accountNumber: string, organization: string) => Promise<boolean>;
  updateAccount: (updatedAccount: AccountInfo) => Promise<boolean>;
  getAccountByNumber: (accountNumber: string) => AccountInfo | undefined;
  clearAccounts: () => Promise<boolean>;
  clearAllPasswordData: () => Promise<boolean>;
  saveAccountPassword: (accountNumber: string, organization: string, password: string, connectedId: string) => Promise<boolean>;
  checkAccountPassword: (accountNumber: string, organization: string) => Promise<boolean>;
  getAccountPassword: (accountNumber: string, organization: string) => Promise<string | null>;
}

// Context 생성
const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

// Storage 키
const ACCOUNTS_STORAGE_KEY = 'ACCOUNTS_LIST';
const DIRECT_PASSWORD_PREFIX = 'direct_password_';

// Provider 컴포넌트
export const AccountsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // 계좌 목록 불러오기
  const loadAccounts = async () => {
    try {
      setLoading(true);
      const savedAccounts = await AsyncStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (savedAccounts) {
        setAccounts(JSON.parse(savedAccounts));
      }
    } catch (error) {
      console.error('계좌 정보 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 계좌 목록 저장
  const saveAccounts = async (accountsList: AccountInfo[]) => {
    try {
      await AsyncStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accountsList));
      return true;
    } catch (error) {
      console.error('계좌 정보 저장 오류:', error);
      return false;
    }
  };

  // 계좌 추가
  const addAccount = async (newAccount: AccountInfo) => {
    try {
      // 이미 존재하는지 확인
      const exists = accounts.some(
        acc => acc.account === newAccount.account && acc.organization === newAccount.organization
      );

      if (!exists) {
        const updatedAccounts = [...accounts, newAccount];
        const success = await saveAccounts(updatedAccounts);
        if (success) {
          setAccounts(updatedAccounts);
        }
        return success;
      }
      return false;
    } catch (error) {
      console.error('계좌 추가 오류:', error);
      return false;
    }
  };

  // 계좌 삭제
  const removeAccount = async (accountNumber: string, organization: string) => {
    try {
      const filteredAccounts = accounts.filter(
        acc => !(acc.account === accountNumber && acc.organization === organization)
      );
      
      if (accounts.length !== filteredAccounts.length) {
        const success = await saveAccounts(filteredAccounts);
        if (success) {
          setAccounts(filteredAccounts);
        }
        return success;
      }
      return false;
    } catch (error) {
      console.error('계좌 삭제 오류:', error);
      return false;
    }
  };

  // 계좌 정보 업데이트
  const updateAccount = async (updatedAccount: AccountInfo) => {
    try {
      const updatedAccounts = accounts.map(account => 
        (account.account === updatedAccount.account && account.organization === updatedAccount.organization) 
          ? updatedAccount 
          : account
      );
      
      const success = await saveAccounts(updatedAccounts);
      if (success) {
        setAccounts(updatedAccounts);
      }
      return success;
    } catch (error) {
      console.error('계좌 업데이트 오류:', error);
      return false;
    }
  };

  // 새로 추가: 모든 비밀번호 관련 데이터 삭제
  const clearAllPasswordData = async () => {
    try {
      // 1. AsyncStorage의 모든 키 가져오기
      const allKeys = await AsyncStorage.getAllKeys();
      
      // 2. 직접 저장된 비밀번호 키 필터링
      const passwordKeys = allKeys.filter(key => key.startsWith(DIRECT_PASSWORD_PREFIX));
      
      // 3. 비밀번호 키 모두 삭제
      if (passwordKeys.length > 0) {
        await AsyncStorage.multiRemove(passwordKeys);
        console.log(`총 ${passwordKeys.length}개의 직접 저장된 비밀번호 키 삭제 완료`);
      }
      
      return true;
    } catch (error) {
      console.error('비밀번호 데이터 전체 삭제 오류:', error);
      return false;
    }
  };

  // 모든 계좌 정보 삭제
  const clearAccounts = async () => {
    try {
      setLoading(true);
      
      // 1. Context 계좌 정보 삭제
      await AsyncStorage.removeItem(ACCOUNTS_STORAGE_KEY);
      setAccounts([]);
      
      // 2. 모든 직접 저장된 비밀번호 삭제
      await clearAllPasswordData();
      
      console.log('모든 계좌 정보가 삭제되었습니다.');
      return true;
    } catch (error) {
      console.error('계좌 정보 전체 삭제 오류:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 계좌번호로 계좌 정보 조회
  const getAccountByNumber = (accountNumber: string) => {
    return accounts.find(account => account.account === accountNumber);
  };
  
  // 새로 추가: 계좌 비밀번호 저장 (통합 함수)
  const saveAccountPassword = async (
    accountNumber: string, 
    organization: string, 
    password: string, 
    connectedId: string
  ) => {
    try {
      console.log(`계좌 비밀번호 저장 시작: ${accountNumber} (${organization})`);
      
      // 계좌 정보 구성
      const accountInfo: AccountInfo = {
        account: accountNumber,
        account_password: password,
        connectedId,
        organization
      };

      // 기존 계좌 확인
      const existingAccount = accounts.find(
        acc => acc.account === accountNumber && acc.organization === organization
      );

      let success = false;
      
      // 기존 계좌면 업데이트, 아니면 추가
      if (existingAccount) {
        console.log(`기존 계좌 정보 업데이트: ${accountNumber}`);
        success = await updateAccount(accountInfo);
      } else {
        console.log(`새 계좌 정보 저장: ${accountNumber}`);
        success = await addAccount(accountInfo);
      }
      
      // 추가로 직접 AsyncStorage에도 저장 (이중 보장)
      if (success) {
        try {
          await AsyncStorage.setItem(`${DIRECT_PASSWORD_PREFIX}${accountNumber}`, password);
          console.log(`계좌 ${accountNumber}의 비밀번호 직접 저장 완료`);
        } catch (err) {
          console.error('직접 저장 오류:', err);
          // 직접 저장 실패해도 전체 저장은 성공으로 간주
        }
      }
      
      return success;
    } catch (error) {
      console.error('계좌 비밀번호 저장 오류:', error);
      return false;
    }
  };
  
  // 새로 추가: 계좌 비밀번호 확인
  const checkAccountPassword = async (accountNumber: string, organization: string) => {
    try {
      // 1. Context에서 확인
      const savedAccount = accounts.find(
        acc => acc.account === accountNumber && acc.organization === organization
      );
      
      const hasContextPassword = !!(savedAccount && savedAccount.account_password);
      
      // 2. 직접 AsyncStorage에서도 확인
      let hasDirectPassword = false;
      try {
        const directPassword = await AsyncStorage.getItem(`${DIRECT_PASSWORD_PREFIX}${accountNumber}`);
        hasDirectPassword = !!directPassword;
      } catch (err) {
        console.error('직접 저장소 확인 오류:', err);
      }
      
      console.log(`계좌 ${accountNumber} 비밀번호 확인 결과: Context=${hasContextPassword}, Direct=${hasDirectPassword}`);
      
      return hasContextPassword || hasDirectPassword;
    } catch (error) {
      console.error('비밀번호 확인 오류:', error);
      return false;
    }
  };
  
  // 새로 추가: 계좌 비밀번호 가져오기
  const getAccountPassword = async (accountNumber: string, organization: string) => {
    try {
      // 1. Context에서 확인
      const savedAccount = accounts.find(
        acc => acc.account === accountNumber && acc.organization === organization
      );
      
      let password = savedAccount?.account_password;
      
      // 2. 직접 저장소에서도 확인
      if (!password) {
        try {
          password = await AsyncStorage.getItem(`${DIRECT_PASSWORD_PREFIX}${accountNumber}`);
        } catch (err) {
          console.error('직접 저장소에서 비밀번호 가져오기 오류:', err);
        }
      }
      
      return password || null;
    } catch (error) {
      console.error('비밀번호 가져오기 오류:', error);
      return null;
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadAccounts();
  }, []);

  return (
    <AccountsContext.Provider 
      value={{ 
        accounts, 
        loading, 
        addAccount, 
        removeAccount, 
        updateAccount, 
        getAccountByNumber,
        clearAccounts,
        clearAllPasswordData,
        saveAccountPassword,
        checkAccountPassword,
        getAccountPassword
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
};

// 커스텀 훅 생성
export const useAccounts = () => {
  const context = useContext(AccountsContext);
  if (context === undefined) {
    throw new Error('useAccounts는 AccountsProvider 내부에서 사용해야 합니다');
  }
  return context;
}; 