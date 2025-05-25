import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { useAccounts } from '../context/AccountsContext';
import { maskAccountNumber } from '../utils/encryptionUtils';

const AccountStoreExample: React.FC = () => {
  const { accounts, loading, addAccount, removeAccount } = useAccounts();
  
  // 새 계좌 정보 입력 상태
  const [account, setAccount] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [connectedId, setConnectedId] = useState('');
  const [organization, setOrganization] = useState('');
  
  // 계좌 추가 처리
  const handleAddAccount = async () => {
    if (!account || !accountPassword || !connectedId || !organization) {
      Alert.alert('입력 오류', '모든 필드를 입력해주세요.');
      return;
    }
    
    const newAccount = {
      account,
      account_password: accountPassword,
      connectedId,
      organization
    };
    
    const success = await addAccount(newAccount);
    
    if (success) {
      // 입력 필드 초기화
      setAccount('');
      setAccountPassword('');
      setConnectedId('');
      setOrganization('');
      
      Alert.alert('성공', '계좌가 추가되었습니다.');
    } else {
      Alert.alert('오류', '계좌 추가에 실패했습니다.');
    }
  };
  
  // 계좌 삭제 처리
  const handleRemoveAccount = async (accountNumber: string, org: string) => {
    Alert.alert(
      '계좌 삭제',
      '정말 이 계좌를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: async () => {
            const success = await removeAccount(accountNumber, org);
            if (success) {
              Alert.alert('성공', '계좌가 삭제되었습니다.');
            } else {
              Alert.alert('오류', '계좌 삭제에 실패했습니다.');
            }
          }
        }
      ]
    );
  };
  
  // 계좌 목록 렌더링
  const renderAccountItem = ({ item }: { item: any }) => (
    <View style={styles.accountItem}>
      <View style={styles.accountInfo}>
        <Text style={styles.accountNumber}>{maskAccountNumber(item.account)}</Text>
        <Text style={styles.organization}>{item.organization}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleRemoveAccount(item.account, item.organization)}
      >
        <Text style={styles.deleteButtonText}>삭제</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>계좌 정보 저장</Text>
      
      {/* 계좌 입력 폼 */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="계좌번호"
          value={account}
          onChangeText={setAccount}
          keyboardType="numeric"
        />
        
        <TextInput
          style={styles.input}
          placeholder="계좌 비밀번호"
          value={accountPassword}
          onChangeText={setAccountPassword}
          secureTextEntry
        />
        
        <TextInput
          style={styles.input}
          placeholder="Connected ID"
          value={connectedId}
          onChangeText={setConnectedId}
        />
        
        <TextInput
          style={styles.input}
          placeholder="기관 코드 (예: 0240)"
          value={organization}
          onChangeText={setOrganization}
        />
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddAccount}
        >
          <Text style={styles.addButtonText}>계좌 추가</Text>
        </TouchableOpacity>
      </View>
      
      {/* 계좌 목록 */}
      <View style={styles.listContainer}>
        <Text style={styles.subtitle}>저장된 계좌 목록</Text>
        
        {loading ? (
          <Text style={styles.loadingText}>로딩 중...</Text>
        ) : accounts.length === 0 ? (
          <Text style={styles.emptyText}>저장된 계좌가 없습니다.</Text>
        ) : (
          <FlatList
            data={accounts}
            renderItem={renderAccountItem}
            keyExtractor={(item) => `${item.account}-${item.organization}`}
            style={styles.list}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  accountInfo: {
    flex: 1,
  },
  accountNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  organization: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AccountStoreExample; 