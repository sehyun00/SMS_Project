// 경로: src/components/RebalancingComponent.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 컴포넌트 임포트
import RForeignComponent from './RForeignComponent';
import RDomesticComponent from './RDomesticComponent';
import RMoneyComponent from './RMoneyComponent';

// 스타일 임포트
import withTheme from '../hoc/withTheme';
import createStyles from '../styles/components/rebalancingComponent.styles';

// 커스텀 훅 임포트
import { useExchangeRate } from '../hooks/useExchangeRate';

// 공통 Theme 타입 가져오기
import { Theme } from '../types/theme';

// 계좌 정보 인터페이스
interface AccountInfo {
  name: string;
  number: string;
  principal: number;
  valuation: number;
  dailyProfit: number;
  dailyProfitPercent: number;
  totalProfit: number;
  totalProfitPercent: number;
}

// 현금 항목 데이터 인터페이스
interface CashItem {
  name: string;
  value: number;
  krwValue: number;
  targetPortion: number;
  rebalanceAmount: number;
}

// 주식 데이터 인터페이스
interface StockItem {
  name: string;
  ticker: string;
  value: number;
  krwValue: number;
  percentChange: number;
  targetPortion: number;
  rebalanceAmount: number;
}

// 컴포넌트 props 인터페이스 정의
interface RebalancingComponentProps {
  theme: Theme;
}

const RebalancingComponent: React.FC<RebalancingComponentProps> = ({ theme }) => {
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  
  // 환율 정보 가져오기
  const { exchangeRate, loading: exchangeRateLoading } = useExchangeRate();
  
  // 화폐 단위 상태 (기본값: 달러)
  const [currencyType, setCurrencyType] = useState<'dollar' | 'won'>('dollar');
  
  // 계좌 정보 샘플 데이터
  const accountInfo: AccountInfo = {
    name: '토스증권',
    number: '3123',
    principal: 5323773,
    valuation: 3716.81,
    dailyProfit: 13.96,
    dailyProfitPercent: 0.3,
    totalProfit: -994.58,
    totalProfitPercent: -26.7
  };

  // 원본 데이터 저장 (달러 기준 - 이 데이터는 변경되지 않음)
  const [originalCashItems] = useState<CashItem[]>([
    {
      name: '원화',
      value: 234.23,
      krwValue: 335499,
      targetPortion: 5,
      rebalanceAmount: -153.32
    },
    {
      name: '달러',
      value: 421.32,
      krwValue: 603478,
      targetPortion: 5,
      rebalanceAmount: -321.36
    }
  ]);
  
  // 원본 해외주식 데이터 (달러 기준 - 이 데이터는 변경되지 않음)
  const [originalForeignStocks] = useState<StockItem[]>([
    { 
      name: 'CONY', 
      ticker: '99.95개',
      value: 822.63, 
      krwValue: 1178294,
      percentChange: -46.9, 
      targetPortion: 15, 
      rebalanceAmount: -230.32
    }
  ]);
  
  // 원본 국내주식 데이터 (달러 기준 - 이 데이터는 변경되지 않음)
  const [originalDomesticStocks] = useState<StockItem[]>([
    { 
      name: '삼성전자', 
      ticker: '15.3개',
      value: 426.63, 
      krwValue: 610161,
      percentChange: -24.9, 
      targetPortion: 15, 
      rebalanceAmount: 32.16
    }
  ]);
  
  // 총 현금 금액
  const totalCash = useMemo(() => {
    return originalCashItems.reduce((sum, item) => sum + item.value, 0);
  }, [originalCashItems]);
  
  // 총 해외주식 금액
  const totalForeign = useMemo(() => {
    return originalForeignStocks.reduce((sum, item) => sum + item.value, 0);
  }, [originalForeignStocks]);
  
  // 총 국내주식 금액
  const totalDomestic = useMemo(() => {
    return originalDomesticStocks.reduce((sum, item) => sum + item.value, 0);
  }, [originalDomesticStocks]);
  
  // 실시간 잔고 계산 (현금 + 모든 종목의 총금액)
  const totalBalance = useMemo(() => {
    return totalCash + totalForeign + totalDomestic;
  }, [totalCash, totalForeign, totalDomestic]);
  
  // 현재 비중 동적 계산을 위한 함수
  const calculateCurrentPortion = (amount: number): number => {
    return parseFloat(((amount / totalBalance) * 100).toFixed(1));
  };
  
  // 통화 전환 버튼 클릭 핸들러
  const handleCurrencyChange = (type: 'dollar' | 'won') => {
    setCurrencyType(type);
  };
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer} 
      showsHorizontalScrollIndicator={false}
    >
      {/* 계좌 정보 영역 */}
      <View style={styles.accountContainer}>
        <Text style={styles.accountTitle}>{accountInfo.name} {accountInfo.number}</Text>
        
        <View style={styles.principalContainer}>
          <Text style={styles.principalLabel}>원금</Text>
          <Text style={styles.principalValue}>
            {currencyType === 'won' 
              ? `${accountInfo.principal.toLocaleString()}원` 
              : `$${(accountInfo.principal / (exchangeRate || 1400)).toFixed(2)}`}
          </Text>
        </View>
        
        {/* 실시간 잔고 영역 추가 */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>실시간 잔고</Text>
          <Text style={styles.balanceValue}>
            {currencyType === 'won' 
              ? `${Math.round(totalBalance * exchangeRate).toLocaleString()}원` 
              : `$${totalBalance.toFixed(2)}`}
          </Text>
        </View>
        
        <View style={styles.profitContainer}>
          <Text style={[styles.profitText, styles.lossText]}>
            {currencyType === 'won' 
              ? `${Math.round(accountInfo.totalProfit * exchangeRate).toLocaleString()}원` 
              : `$${accountInfo.totalProfit.toFixed(2)}`}
            ({accountInfo.totalProfitPercent}%)
          </Text>
        </View>
        
        <View style={styles.dailyProfitContainer}>
          <Text style={[styles.dailyProfitText, styles.gainText]}>
            일간 수익 
            {currencyType === 'won'
              ? `+${Math.round(accountInfo.dailyProfit * exchangeRate).toLocaleString()}원`
              : `+$${accountInfo.dailyProfit.toFixed(2)}`}
            ({accountInfo.dailyProfitPercent}%)
          </Text>
        </View>
        
        {/* 통화 전환 버튼 */}
        <View style={styles.currencyToggleContainer}>
          <TouchableOpacity 
            style={[styles.currencyButton, currencyType === 'dollar' ? styles.activeCurrency : null]}
            onPress={() => handleCurrencyChange('dollar')}
          >
            <Text style={[
              styles.currencyText, 
              currencyType === 'dollar' ? styles.activeCurrencyText : null
            ]}>$</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.currencyButton, currencyType === 'won' ? styles.activeCurrency : null]}
            onPress={() => handleCurrencyChange('won')}
          >
            <Text style={[
              styles.currencyText, 
              currencyType === 'won' ? styles.activeCurrencyText : null
            ]}>원</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* 현금 영역 */}
      <RMoneyComponent
        totalAmount={totalCash}
        cashItems={originalCashItems}
        currencyType={currencyType}
        exchangeRate={exchangeRate || 1400}
        totalBalance={totalBalance}
        calculateCurrentPortion={calculateCurrentPortion}
      />
      
      {/* 해외주식 영역 */}
      <RForeignComponent
        totalAmount={totalForeign}
        percentChange={-27.2}
        stocks={originalForeignStocks}
        currencyType={currencyType}
        exchangeRate={exchangeRate || 1400}
        totalBalance={totalBalance}
        calculateCurrentPortion={calculateCurrentPortion}
      />
      
      {/* 국내주식 영역 */}
      <RDomesticComponent
        totalAmount={totalDomestic}
        percentChange={-15.2}
        stocks={originalDomesticStocks}
        currencyType={currencyType}
        exchangeRate={exchangeRate || 1400}
        totalBalance={totalBalance}
        calculateCurrentPortion={calculateCurrentPortion}
      />
    </ScrollView>
  );
};

export default withTheme(RebalancingComponent);
