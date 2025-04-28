// 경로: src/components/RebalancingComponent.tsx
// 흐름도: App.js > AppNavigator.js > MainPage.jsx > RebalancingComponent.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 컴포넌트 임포트
import RForeignComponent from './RForeignComponent';
import RDomesticComponent from './RDomesticComponent';
import RMoneyComponent from './RMoneyComponent';

// 더미 데이터 임포트 - 새로운 구조
import { 
  dummyAccounts, 
  dummyRecords,
  getAccountRecords,
  getRecordRuds,
  calculateRecordValue,
  getCurrentExchangeRate
} from '../data/dummyData';

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
  const currentExchangeRate = exchangeRate || getCurrentExchangeRate();
  
  // 화폐 단위 상태 (기본값: 달러)
  const [currencyType, setCurrencyType] = useState<'dollar' | 'won'>('dollar');
  
  // 선택된 계좌 상태 (기본값: 첫 번째 계좌)
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
  
  // 선택된 계좌의 리밸런싱 기록 목록
  const accountRecords = useMemo(() => {
    const account = dummyAccounts[selectedAccountIndex];
    return getAccountRecords(account.account);
  }, [selectedAccountIndex]);
  
  // 선택된 리밸런싱 기록 ID (기본값: 가장 최근 기록)
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  
  // 선택된 리밸런싱 기록 확정 (없으면 가장 최근 것으로)
  const currentRecordId = useMemo(() => {
    if (selectedRecordId !== null) return selectedRecordId;
    if (accountRecords.length === 0) return null;
    
    // 가장 최근 리밸런싱 기록 선택
    const sortedRecords = [...accountRecords].sort(
      (a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
    );
    return sortedRecords[0].record_id;
  }, [selectedRecordId, accountRecords]);
  
  // 선택된 리밸런싱 기록 상세 데이터 가져오기
  const recordRuds = useMemo(() => {
    if (currentRecordId === null) return [];
    return getRecordRuds(currentRecordId);
  }, [currentRecordId]);
  
  // Rud 데이터를 CashItem 형식으로 변환하는 함수
  const getCashItems = useMemo((): CashItem[] => {
    return recordRuds
      .filter(rud => rud.stock_region === 0)
      .map(rud => ({
        name: rud.stock_name,
        value: rud.dollar || (rud.won ? rud.won / currentExchangeRate : 0),
        krwValue: rud.won || (rud.dollar ? rud.dollar * currentExchangeRate : 0),
        targetPortion: rud.expert_per,
        rebalanceAmount: rud.rebalance_dollar || 0
      }));
  }, [recordRuds, currentExchangeRate]);
  
  // Rud 데이터를 StockItem 형식으로 변환하는 함수 (해외주식)
  const getForeignStocks = useMemo((): StockItem[] => {
    return recordRuds
      .filter(rud => rud.stock_region === 2)
      .map(rud => ({
        name: rud.stock_name,
        ticker: rud.nos ? `${rud.nos}개` : '',
        value: rud.dollar || 0,
        krwValue: (rud.dollar || 0) * currentExchangeRate,
        percentChange: rud.rate || 0,
        targetPortion: rud.expert_per,
        rebalanceAmount: rud.rebalance_dollar || 0
      }));
  }, [recordRuds, currentExchangeRate]);
  
  // Rud 데이터를 StockItem 형식으로 변환하는 함수 (국내주식)
  const getDomesticStocks = useMemo((): StockItem[] => {
    return recordRuds
      .filter(rud => rud.stock_region === 1)
      .map(rud => ({
        name: rud.stock_name,
        ticker: rud.nos ? `${rud.nos}개` : '',
        value: (rud.won || 0) / currentExchangeRate,
        krwValue: rud.won || 0,
        percentChange: rud.rate || 0,
        targetPortion: rud.expert_per,
        rebalanceAmount: rud.rebalance_dollar || 0
      }));
  }, [recordRuds, currentExchangeRate]);
  
  // 계좌 정보 (dummyAccounts에서 선택된 계좌 사용)
  const accountInfo: AccountInfo = useMemo(() => {
    const account = dummyAccounts[selectedAccountIndex];
    
    // 총 자산 가치 계산
    const totalValue = currentRecordId ? calculateRecordValue(currentRecordId) : 0;
    
    // 원금 대비 손익 계산
    const dollarPrincipal = account.principal / currentExchangeRate;
    const profit = totalValue - dollarPrincipal;
    const profitPercent = (profit / dollarPrincipal) * 100;
    
    // 일간 손익 계산 (전날 잔고 기준)
    const prePrincipalInDollars = account.pre_principal / currentExchangeRate;
    const dailyProfit = totalValue - prePrincipalInDollars;
    const dailyProfitPercent = (dailyProfit / prePrincipalInDollars) * 100;
    
    return {
      name: account.company,
      number: account.account.slice(-4), // 계좌번호 마지막 4자리
      principal: account.principal,
      valuation: totalValue,
      dailyProfit: dailyProfit,
      dailyProfitPercent: parseFloat(dailyProfitPercent.toFixed(1)),
      totalProfit: profit,
      totalProfitPercent: parseFloat(profitPercent.toFixed(1))
    };
  }, [selectedAccountIndex, currentRecordId, currentExchangeRate]);
  
  // 총 현금 금액
  const totalCash = useMemo(() => {
    return getCashItems.reduce((sum, item) => sum + item.value, 0);
  }, [getCashItems]);
  
  // 총 해외주식 금액
  const totalForeign = useMemo(() => {
    return getForeignStocks.reduce((sum, item) => sum + item.value, 0);
  }, [getForeignStocks]);
  
  // 총 국내주식 금액
  const totalDomestic = useMemo(() => {
    return getDomesticStocks.reduce((sum, item) => sum + item.value, 0);
  }, [getDomesticStocks]);
  
  // 실시간 잔고 계산 (현금 + 모든 종목의 총금액)
  const totalBalance = useMemo(() => {
    return totalCash + totalForeign + totalDomestic;
  }, [totalCash, totalForeign, totalDomestic]);
  
  // 현재 비중 동적 계산을 위한 함수
  const calculateCurrentPortion = (amount: number): number => {
    if (totalBalance === 0) return 0;
    return parseFloat(((amount / totalBalance) * 100).toFixed(1));
  };
  
  // 통화 전환 버튼 클릭 핸들러
  const handleCurrencyChange = (type: 'dollar' | 'won') => {
    setCurrencyType(type);
  };
  
  // 계좌 선택 핸들러
  const handleAccountChange = (index: number) => {
    setSelectedAccountIndex(index);
    setSelectedRecordId(null); // 계좌 변경 시 리밸런싱 기록 선택 초기화
  };
  
  // 종목 평균 변화율 계산
  const getForeignPercentChange = useMemo(() => {
    if (getForeignStocks.length === 0) return 0;
    const totalPercentChange = getForeignStocks.reduce((sum, stock) => sum + stock.percentChange, 0);
    return parseFloat((totalPercentChange / getForeignStocks.length).toFixed(1));
  }, [getForeignStocks]);
  
  const getDomesticPercentChange = useMemo(() => {
    if (getDomesticStocks.length === 0) return 0;
    const totalPercentChange = getDomesticStocks.reduce((sum, stock) => sum + stock.percentChange, 0);
    return parseFloat((totalPercentChange / getDomesticStocks.length).toFixed(1));
  }, [getDomesticStocks]);
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer} 
      showsHorizontalScrollIndicator={false}
    >
      {/* 계좌 선택 영역 */}
      <View style={styles.accountSelectorContainer}>
        {dummyAccounts.map((account, index) => (
          <TouchableOpacity
            key={account.account}
            style={[
              styles.accountButton,
              selectedAccountIndex === index ? styles.selectedAccountButton : null
            ]}
            onPress={() => handleAccountChange(index)}
          >
            <Text style={selectedAccountIndex === index ? styles.selectedAccountText : styles.accountText}>
              {account.company} {account.account.slice(-4)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* 계좌 정보 영역 */}
      <View style={styles.accountContainer}>
        <Text style={styles.accountTitle}>{accountInfo.name} {accountInfo.number}</Text>
        
        <View style={styles.principalContainer}>
          <Text style={styles.principalLabel}>원금</Text>
          <Text style={styles.principalValue}>
            {currencyType === 'won' 
              ? `${accountInfo.principal.toLocaleString()}원` 
              : `$${(accountInfo.principal / currentExchangeRate).toFixed(2)}`}
          </Text>
        </View>
        
        {/* 실시간 잔고 영역 */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>실시간 잔고</Text>
          <Text style={styles.balanceValue}>
            {currencyType === 'won' 
              ? `${Math.round(totalBalance * currentExchangeRate).toLocaleString()}원` 
              : `$${totalBalance.toFixed(2)}`}
          </Text>
        </View>
        
        <View style={styles.profitContainer}>
          <Text style={[
            styles.profitText, 
            accountInfo.totalProfit < 0 ? styles.lossText : styles.gainText
          ]}>
            {currencyType === 'won' 
              ? `${Math.round(accountInfo.totalProfit * currentExchangeRate).toLocaleString()}원` 
              : `$${accountInfo.totalProfit.toFixed(2)}`}
            ({accountInfo.totalProfitPercent}%)
          </Text>
        </View>
        
        <View style={styles.dailyProfitContainer}>
          <Text style={[
            styles.dailyProfitText, 
            accountInfo.dailyProfit < 0 ? styles.lossText : styles.gainText
          ]}>
            일간 수익 
            {currencyType === 'won'
              ? `${accountInfo.dailyProfit >= 0 ? '+' : ''}${Math.round(accountInfo.dailyProfit * currentExchangeRate).toLocaleString()}원`
              : `${accountInfo.dailyProfit >= 0 ? '+' : ''}$${accountInfo.dailyProfit.toFixed(2)}`}
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
        cashItems={getCashItems}
        currencyType={currencyType}
        exchangeRate={currentExchangeRate}
        totalBalance={totalBalance}
        calculateCurrentPortion={calculateCurrentPortion}
      />
      
      {/* 해외주식 영역 */}
      <RForeignComponent
        totalAmount={totalForeign}
        percentChange={getForeignPercentChange}
        stocks={getForeignStocks}
        currencyType={currencyType}
        exchangeRate={currentExchangeRate}
        totalBalance={totalBalance}
        calculateCurrentPortion={calculateCurrentPortion}
      />
      
      {/* 국내주식 영역 */}
      <RDomesticComponent
        totalAmount={totalDomestic}
        percentChange={getDomesticPercentChange}
        stocks={getDomesticStocks}
        currencyType={currencyType}
        exchangeRate={currentExchangeRate}
        totalBalance={totalBalance}
        calculateCurrentPortion={calculateCurrentPortion}
      />
    </ScrollView>
  );
};

export default withTheme(RebalancingComponent);
