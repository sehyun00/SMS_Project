// 파일 경로: src/components/RecordComponent.tsx
// 컴포넌트 흐름: App.js > AppNavigator.js > MainPage.jsx > RecordComponent.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

// 더미 데이터 임포트
import {
  dummyAccounts,
  dummyRecords,
  getAccountRecords,
  getRecordRuds,
  getCurrentExchangeRate
} from '../../../data/dummyData';

// 스타일 임포트
import { styles } from '../../../styles/components/recordComponent.styles';

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
  dailyProfit: number;
  dailyProfitRate: number;
  records: Record[];
}

// 컴포넌트 props 인터페이스 정의
interface RecordComponentProps {
  navigation?: any; // 네비게이션 props (필요한 경우)
}

// React.FC를 사용해 함수 컴포넌트 타입 지정
const RecordComponent: React.FC<RecordComponentProps> = ({ navigation }) => {
  // 계좌 요약 정보 상태
  const [accountSummaries, setAccountSummaries] = useState<AccountSummary[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<number | null>(null);
  const exchangeRate = getCurrentExchangeRate();

  // 계좌 요약 정보 생성 (실제로는 API 호출 등을 통해 가져올 것)
  useEffect(() => {
    // 각 계좌에 대한 요약 정보 생성
    const summaries = dummyAccounts.map(account => {
      const records = getAccountRecords(account.account);

      // 임의의 총 손익 및 일간 손익 계산 (실제로는 API에서 가져옴)
      const totalProfit = account.principal * 0.05 * (Math.random() > 0.5 ? -1 : 1);
      const totalProfitRate = (totalProfit / account.principal) * 100;

      const dailyProfit = (account.principal - account.pre_principal);
      const dailyProfitRate = (dailyProfit / account.pre_principal) * 100;

      return {
        company: account.company,
        account: account.account,
        balance: account.principal,
        totalProfit,
        totalProfitRate,
        dailyProfit,
        dailyProfitRate,
        records
      };
    });

    setAccountSummaries(summaries);
  }, []);

  // 날짜를 "YYYY.MM.DD" 형식으로 포맷
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  // 리밸런싱 기록 클릭 핸들러
  const handleRecordClick = (recordId: number) => {
    if (navigation) {
      // 네비게이션이 있는 경우 상세 페이지로 이동
      navigation.navigate('RebalancingDetailPage', { recordId });
    } else {
      // 네비게이션이 없는 경우 선택된 기록 상태 변경
      setSelectedRecord(selectedRecord === recordId ? null : recordId);
      
      // 선택된 기록의 상세 정보 가져오기
      const recordRuds = getRecordRuds(recordId);
      console.log('선택된 리밸런싱 기록 상세:', recordRuds);
      
      // 여기에 모달 표시나 추가 로직 구현 가능
    }
  };

  return (
    <ScrollView style={styles.container}>
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

          {/* 일간 수익 정보 */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>일간 수익</Text>
            <Text style={[
              styles.infoValue,
              summary.dailyProfit < 0 ? styles.negativeValue : styles.positiveValue
            ]}>
              {summary.dailyProfit < 0 ? '' : '+'}
              {summary.dailyProfit.toLocaleString()}원
              ({summary.dailyProfitRate.toFixed(1)}%)
            </Text>
          </View>

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
          
          {/* 선택된 기록의 상세 정보 표시 (옵션) */}
          {selectedRecord && summary.records.some(r => r.record_id === selectedRecord) && (
            <View style={styles.recordDetail}>
              <Text style={styles.recordDetailTitle}>리밸런싱 상세 정보</Text>
              {/* 여기에 선택된 리밸런싱의 상세 정보 표시 */}
              <Text>기록 ID: {selectedRecord}</Text>
              <Text>구현중입니다.^^</Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

export default RecordComponent;
