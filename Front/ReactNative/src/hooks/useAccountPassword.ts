import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAccounts } from '../context/AccountsContext';
import { SavedAccountInfo } from '../types/account';
import { findSecuritiesFirmByName } from '../data/organizationData';

interface AccountPasswordHookResult {
  showPasswordModal: boolean;
  accountPassword: string;
  passwordError: string;
  setShowPasswordModal: (show: boolean) => void;
  setAccountPassword: (password: string) => void;
  setPasswordError: (error: string) => void;
  checkSavedPassword: (accountNumber: string, organization: string) => Promise<boolean>;
  saveAccountPassword: (accountNumber: string, password: string) => Promise<void>;
  getAccountPassword: (accountNumber: string) => Promise<string | null>;
  findSavedAccount: (accountNumber: string, organization: string) => SavedAccountInfo | undefined;
}

export const useAccountPassword = (): AccountPasswordHookResult => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { accounts: savedAccounts, addAccount: saveAccount, updateAccount } = useAccounts();

  // 저장된 계좌 찾기
  const findSavedAccount = (accountNumber: string, organization: string): SavedAccountInfo | undefined => {
    return savedAccounts.find(acc => 
      acc.account === accountNumber && acc.organization === organization
    );
  };

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

  const saveAccountPassword = async (accountNumber: string, password: string): Promise<void> => {
    try {
      // 증권사 정보 찾기
      const account = savedAccounts.find(acc => acc.account === accountNumber);
      if (!account) {
        throw new Error('계좌 정보를 찾을 수 없습니다.');
      }

      // 계좌 정보 업데이트
      const updatedAccount = {
        ...account,
        account_password: password
      };

      // Context 업데이트
      await updateAccount(updatedAccount);

      // AsyncStorage에도 저장
      await AsyncStorage.setItem(`direct_password_${accountNumber}`, password);
    } catch (error) {
      console.error('비밀번호 저장 실패:', error);
      throw error;
    }
  };

  const getAccountPassword = async (accountNumber: string): Promise<string | null> => {
    try {
      // Context에서 먼저 확인
      const account = savedAccounts.find(acc => acc.account === accountNumber);
      if (account?.account_password) {
        return account.account_password;
      }

      // AsyncStorage에서 확인
      return await AsyncStorage.getItem(`direct_password_${accountNumber}`);
    } catch (error) {
      console.error('비밀번호 조회 실패:', error);
      return null;
    }
  };

  return {
    showPasswordModal,
    accountPassword,
    passwordError,
    setShowPasswordModal,
    setAccountPassword,
    setPasswordError,
    checkSavedPassword,
    saveAccountPassword,
    getAccountPassword,
    findSavedAccount
  };
}; 