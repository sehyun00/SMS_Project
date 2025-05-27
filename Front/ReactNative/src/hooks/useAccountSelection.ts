import { useState, useEffect } from 'react';
import { fetchStockAccounts, fetchConnectedAccounts } from '../api/connectedAccountApi';
import { AccountInfo, ConnectedAccount } from '../types/account';
import { useAccounts } from '../context/AccountsContext';
import { findSecuritiesFirmByName } from '../data/organizationData';

export const useAccountSelection = () => {
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
  const [stockAccounts, setStockAccounts] = useState<AccountInfo[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { accounts: savedAccounts } = useAccounts();

  useEffect(() => {
    const loadAccounts = async () => {
      setIsLoading(true);
      try {
        const connected = await fetchConnectedAccounts();
        setConnectedAccounts(connected);
        
        const accounts = await fetchStockAccounts();
        setStockAccounts(accounts);
      } catch (error) {
        console.error('계좌 정보 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAccounts();
  }, []);

  const handleAccountChange = (index: number) => {
    setSelectedAccountIndex(index);
  };

  const getSelectedAccount = () => {
    return stockAccounts[selectedAccountIndex];
  };

  const findConnectedIdByAccountNumber = (accountNumber: string): string | undefined => {
    const account = connectedAccounts.find(acc => acc.accountNumber === accountNumber);
    return account?.connectedId;
  };

  return {
    selectedAccountIndex,
    stockAccounts,
    connectedAccounts,
    isLoading,
    handleAccountChange,
    getSelectedAccount,
    findConnectedIdByAccountNumber
  };
}; 