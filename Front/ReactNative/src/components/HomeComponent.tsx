// 경로: src/components/HomeComponent.tsx
// 흐름도: App.tsx > AppNavigator.tsx > MainPage.tsx > HomeComponent.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 스타일 임포트
import withTheme from '../hoc/withTheme';
import createStyles from '../styles/components/homeComponent.styles';
import { Theme } from '../types/theme';

// 계좌 데이터 인터페이스 정의
interface AccountData {
  company: string;
  accountNumber: string;
  returnRate: number;
}

// 리밸런싱 기록 인터페이스 정의
interface RebalancingRecord {
  name: string;
  returnRate: number;
}

// 컴포넌트 props 인터페이스 정의
interface HomeComponentProps {
  theme: Theme;
}

const HomeComponent: React.FC<HomeComponentProps> = ({ theme }) => {
  // 계좌 데이터 샘플 (실제로는 API에서 가져올 것)
  const [hasAccounts, setHasAccounts] = useState<boolean>(true);
  const [accounts, setAccounts] = useState<AccountData[]>([
    { company: '토스증권', accountNumber: '0345-135611-3123', returnRate: 4.2 },
    { company: '한국투자', accountNumber: '315411-341411-13', returnRate: -3.3 }
  ]);

  // 리밸런싱 기록 샘플
  const [hasRecords, setHasRecords] = useState<boolean>(true);
  const [records, setRecords] = useState<RebalancingRecord[]>([
    { name: '토스 공격형 투자', returnRate: 1.3 },
    { name: '토스 안전형 투자', returnRate: 0.5 },
    { name: '한투 안전형 투자', returnRate: 0.3 }
  ]);

  // 테스트용 함수: 계좌 유무 토글
  const toggleAccounts = () => {
    setHasAccounts(!hasAccounts);
  };

  // 테스트용 함수: 기록 유무 토글
  const toggleRecords = () => {
    setHasRecords(!hasRecords);
  };

  const styles = createStyles(theme);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 계좌 섹션 */}
      <View>
        <Text style={styles.sectionTitle}>계좌</Text>
        {hasAccounts ? (
          <View style={styles.card}>
            {accounts.map((account, index) => (
              <View key={index}>
                <View style={styles.accountRow}>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountCompany}>{account.company} {account.accountNumber}</Text>
                  </View>
                </View>
                {index < accounts.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.card, styles.noAccountContainer]}>
            <Text style={styles.noAccountText}>계좌가 아직 없어요</Text>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>계좌 추가하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 계좌 수익률 섹션 */}
      <View>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
          <Text style={styles.sectionTitle}>계좌 수익률</Text>
          <Text style={styles.dateText}>1월 1일 기준</Text>
        </View>
        
        {hasAccounts ? (
          <View style={styles.card}>
            {accounts.map((account, index) => (
              <View key={index}>
                <View style={styles.accountItemRow}>
                  <View style={styles.accountItem}>
                    <Text style={styles.accountItemText}>
                      {account.company.split('증권')[0] || account.company.substring(0, 2)}
                      {account.accountNumber.split('-')[0]}
                    </Text>
                  </View>
                  <Text
                    style={account.returnRate > 0 ? styles.returnRatePositive : styles.returnRateNegative}
                  >
                    {account.returnRate > 0 ? '+' : ''}{account.returnRate}%
                  </Text>
                </View>
                {index < accounts.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={{fontSize: 14, color: theme.colors.placeholder, textAlign: 'center'}}>
              계좌가 아직 없어요
            </Text>
          </View>
        )}
      </View>

      {/* 리밸런싱 기록 수익률 섹션 */}
      <View>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
          <Text style={styles.sectionTitle}>리밸런싱 기록 수익률</Text>
          <Text style={styles.dateText}>1일 전 기준</Text>
        </View>
        
        {hasRecords ? (
          <View style={styles.card}>
            {records.map((record, index) => (
              <View key={index}>
                <View style={styles.accountItemRow}>
                  <View style={styles.accountItem}>
                    <Text style={styles.accountItemText}>{record.name}</Text>
                  </View>
                  <Text
                    style={record.returnRate > 0 ? styles.returnRatePositive : styles.returnRateNegative}
                  >
                    {record.returnRate > 0 ? '+' : ''}{record.returnRate}%
                  </Text>
                </View>
                {index < records.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={{fontSize: 14, color: theme.colors.placeholder, textAlign: 'center'}}>
              기록이 아직 없어요
            </Text>
          </View>
        )}
      </View>

      {/* 테스트를 위한 토글 버튼 (실제 앱에서는 제거) */}
      {process.env.NODE_ENV === 'development' && (
        <View style={{marginTop: 20}}>
          <TouchableOpacity 
            style={{backgroundColor: theme.colors.primary, padding: 10, borderRadius: 5, marginBottom: 10}}
            onPress={toggleAccounts}
          >
            <Text style={{color: 'white', textAlign: 'center'}}>
              테스트: 계좌 {hasAccounts ? '없음' : '있음'} 상태로 전환
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{backgroundColor: theme.colors.primary, padding: 10, borderRadius: 5}}
            onPress={toggleRecords}
          >
            <Text style={{color: 'white', textAlign: 'center'}}>
              테스트: 기록 {hasRecords ? '없음' : '있음'} 상태로 전환
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

// React.memo를 사용하여 불필요한 리렌더링 방지
export default withTheme(HomeComponent);
