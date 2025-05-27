import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { findSecuritiesFirmByName } from '../../data/organizationData';
import createStyles from '../../styles/components/accountSelectorComponent.styles';
import { Theme } from '../../types/theme';

// API에서 가져오는 계좌 정보 인터페이스
interface ApiAccountInfo {
  company: string;
  accountNumber: string;
  returnRate?: number;
}

// 컴포넌트 props 인터페이스
interface AccountSelectorProps {
  theme: Theme;
  accounts: ApiAccountInfo[];
  selectedAccountIndex: number;
  onAccountChange: (index: number) => void;
  isLoading?: boolean;
}

const AccountSelectorComponent: React.FC<AccountSelectorProps> = ({
  theme,
  accounts,
  selectedAccountIndex,
  onAccountChange,
  isLoading = false
}) => {
  const styles = createStyles(theme);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // 디버깅용 로그
  useEffect(() => {
    console.log('계좌 목록:', accounts.length > 0 ? accounts.map(acc => acc.company + ' ' + acc.accountNumber.slice(-4)) : '없음');
    console.log('선택된 계좌 인덱스:', selectedAccountIndex);
  }, [accounts, selectedAccountIndex]);

  // 증권사 약식 이름 가져오기
  const getShortName = (fullName: string): string => {
    const firm = findSecuritiesFirmByName(fullName);
    return firm?.shortName || fullName;
  };

  // 계좌번호 마스킹 처리 (앞 두 자리와 뒤 네 자리만 표시)
  const maskAccountNumber = (accountNumber: string): string => {
    if (accountNumber.length <= 6) return accountNumber;
    
    const firstTwo = accountNumber.substring(0, 2);
    const lastFour = accountNumber.substring(accountNumber.length - 4);
    
    return `${firstTwo}**-${lastFour}`;
  };

  // 현재 선택된 계좌 가져오기
  const getSelectedAccount = (): ApiAccountInfo | null => {
    if (accounts.length === 0 || selectedAccountIndex >= accounts.length) {
      return null;
    }
    return accounts[selectedAccountIndex];
  };

  // 드롭다운 열기
  const openDropdown = () => {
    if (isLoading || accounts.length <= 1) return;
    setDropdownVisible(true);
  };

  // 드롭다운 닫기
  const closeDropdown = () => {
    setDropdownVisible(false);
  };

  // 계좌 선택 처리
  const handleAccountSelect = (index: number) => {
    onAccountChange(index);
    closeDropdown();
  };

  // 선택된 계좌 렌더링
  const renderSelectedAccount = () => {
    const selectedAccount = getSelectedAccount();
    
    if (!selectedAccount) {
      return (
        <TouchableOpacity
          style={styles.selectedAccountContainer}
          onPress={openDropdown}
          disabled={isLoading || accounts.length <= 1}
        >
          <View style={styles.selectedAccountTextContainer}>
            <Text style={styles.noAccountText}>계좌를 선택하세요</Text>
          </View>
          {accounts.length > 1 && (
            <Ionicons 
              name={dropdownVisible ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="white" 
            />
          )}
        </TouchableOpacity>
      );
    }

    const companyShortName = getShortName(selectedAccount.company);
    const maskedAccountNumber = maskAccountNumber(selectedAccount.accountNumber);

    return (
      <TouchableOpacity
        style={styles.selectedAccountContainer}
        onPress={openDropdown}
        disabled={isLoading || accounts.length <= 1}
      >
        <View style={styles.selectedAccountTextContainer}>
          <Text style={styles.selectedAccountText}>{companyShortName} {maskedAccountNumber}</Text>
        </View>
        {accounts.length > 1 && (
          <Ionicons 
            name={dropdownVisible ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="white" 
          />
        )}
      </TouchableOpacity>
    );
  };

  // 드롭다운 항목 렌더링
  const renderAccountItem = ({ item, index }: { item: ApiAccountInfo; index: number }) => {
    const isSelected = index === selectedAccountIndex;
    const companyShortName = getShortName(item.company);
    const maskedAccountNumber = maskAccountNumber(item.accountNumber);

    return (
      <TouchableOpacity
        style={[
          styles.accountItem,
          isSelected ? styles.selectedAccountItem : null
        ]}
        onPress={() => handleAccountSelect(index)}
      >
        <Text style={[
          styles.accountItemText,
          isSelected ? styles.selectedAccountItemText : null
        ]}>
          {companyShortName} {maskedAccountNumber}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color="white" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { width: '100%' }]}>
      {accounts.length === 0 ? (
        <View style={styles.selectedAccountContainer}>
          <Text style={styles.noAccountText}>등록된 계좌가 없습니다</Text>
        </View>
      ) : (
        renderSelectedAccount()
      )}

      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDropdown}
      >
        <TouchableWithoutFeedback onPress={closeDropdown}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.dropdown, { backgroundColor: theme.colors.background }]}>
                <FlatList
                  data={accounts}
                  keyExtractor={(item, index) => `account-${index}-${item.accountNumber}`}
                  renderItem={renderAccountItem}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  style={styles.accountList}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default AccountSelectorComponent; 