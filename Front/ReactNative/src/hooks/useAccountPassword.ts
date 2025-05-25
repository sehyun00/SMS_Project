import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAccounts } from '../context/AccountsContext';
import { SavedAccountInfo } from '../types/account';

export const useAccountPassword = () => {
  const { accounts: savedAccounts } = useAccounts();

  // 저장된 계좌 찾기
  const findSavedAccount = (accountNumber: string, organization: string): SavedAccountInfo | undefined => {
    return savedAccounts.find(acc => 
      acc.account === accountNumber && acc.organization === organization
    );
  };

  // 계좌 비밀번호 확인
  const checkAccountPassword = async (accountNumber: string, organization: string): Promise<boolean> => {
    try {
      // 1. AccountsContext에서 계좌 정보 찾기
      const savedAccount = findSavedAccount(accountNumber, organization);
      const hasContextPassword = !!(savedAccount && savedAccount.account_password);
      
      // 2. 직접 AsyncStorage에서도 확인
      const directPassword = await AsyncStorage.getItem(`direct_password_${accountNumber}`);
      const hasDirectPassword = !!directPassword;
      
      console.log(`계좌 ${accountNumber} 비밀번호 확인 결과: Context=${hasContextPassword}, Direct=${hasDirectPassword}`);
      
      return hasContextPassword || hasDirectPassword;
    } catch (error) {
      console.error('비밀번호 확인 오류:', error);
      return false;
    }
  };

  // 계좌 비밀번호 가져오기
  const getAccountPassword = async (accountNumber: string, organization: string): Promise<string | null> => {
    try {
      // 1. AccountsContext에서 계좌 정보 찾기
      const savedAccount = findSavedAccount(accountNumber, organization);
      let storedPassword = savedAccount?.account_password;
      
      // 2. 직접 AsyncStorage에서도 확인
      if (!storedPassword) {
        storedPassword = await AsyncStorage.getItem(`direct_password_${accountNumber}`);
      }
      
      return storedPassword;
    } catch (error) {
      console.error('비밀번호 조회 오류:', error);
      return null;
    }
  };

  // 계좌 비밀번호 저장
  const saveAccountPassword = async (
    accountNumber: string,
    password: string,
    organization: string
  ): Promise<boolean> => {
    try {
      // AsyncStorage에 직접 저장
      await AsyncStorage.setItem(`direct_password_${accountNumber}`, password);
      console.log(`계좌 ${accountNumber}의 비밀번호 직접 저장 완료`);
      return true;
    } catch (error) {
      console.error('비밀번호 저장 오류:', error);
      return false;
    }
  };

  return {
    checkAccountPassword,
    getAccountPassword,
    saveAccountPassword,
    findSavedAccount
  };
}; 