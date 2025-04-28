// 경로: src/components/RebalancingComponent.tsx
// 흐름도: App.js > AppNavigator.js > MainPage.jsx > RebalancingComponent.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 컴포넌트 임포트
import RForeignComponent from './RForeignComponent';
import RDomesticComponent from './RDomesticComponent';
import RMoneyComponent from './RMoneyComponent';

// 더미 데이터 임포트
import {
  dummyAccounts,
  dummyRuds,
  getAccountRuds,
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

  // Rud 데이터를 CashItem 형식으로 변환하는 함수
  const convertRudsToCashItems = (ruds: any[]): CashItem[] => {
    return ruds
      .filter(rud => rud.stock_region === 0)
      .map(rud => ({
        name: rud.stock_name,
        value: rud.dollar || (rud.won ? rud.won / currentExchangeRate : 0),
        krwValue: rud.won || (rud.dollar ? rud.dollar * currentExchangeRate : 0),
        targetPortion: rud.expert_per,
        rebalanceAmount: rud.dollar ? -rud.dollar * 0.1 : -rud.won / currentExchangeRate * 0.1 // 예시 계산
      }));
  };

  // Rud 데이터를 StockItem 형식으로 변환하는 함수
  const convertRudsToStockItems = (ruds: any[], isInternational: boolean): StockItem[] => {
    return ruds
      .filter(rud => rud.stock_region === (isInternational ? 2 : 1))
      .map(rud => ({
        name: rud.stock_name,
        ticker: `${rud.nos}개`,
        value: isInternational ? (rud.dollar || 0) : ((rud.won || 0) / currentExchangeRate),
        krwValue: isInternational ? ((rud.dollar || 0) * currentExchangeRate) : (rud.won || 0),
        percentChange: rud.rate,
        targetPortion: rud.expert_per,
        rebalanceAmount: isInternational
          ? rud.dollar * 0.05
          : (rud.won / currentExchangeRate) * 0.05 // 예시 계산
      }));
  };

  // 데이터 상태 저장
  const [cashItems, setCashItems] = useState<CashItem[]>([]);
  const [foreignStocks, setForeignStocks] = useState<StockItem[]>([]);
  const [domesticStocks, setDomesticStocks] = useState<StockItem[]>([]);

  // 선택된 계좌에 따라 데이터 업데이트
  useEffect(() => {
    const selectedAccount = dummyAccounts[selectedAccountIndex];
    const accountRuds = getAccountRuds(selectedAccount.account);

    // 데이터 변환 및 상태 업데이트
    setCashItems(convertRudsToCashItems(accountRuds));
    setForeignStocks(convertRudsToStockItems(accountRuds, true));
    setDomesticStocks(convertRudsToStockItems(accountRuds, false));
  }, [selectedAccountIndex, currentExchangeRate]);

  // 계좌 정보 (dummyAccounts에서 선택된 계좌 사용)
  const accountInfo: AccountInfo = useMemo(() => {
    const account = dummyAccounts[selectedAccountIndex];

    // 계좌의 총 자산 가치 계산
    const accountRuds = getAccountRuds(account.account);
    const totalValue = accountRuds.reduce((sum, rud) => {
      if (rud.stock_region === 0) { // 현금
        return sum + (rud.dollar || (rud.won ? rud.won / currentExchangeRate : 0));
      } else if (rud.stock_region === 1) { // 국내주식
        return sum + ((rud.won || 0) / currentExchangeRate);
      } else { // 해외주식
        return sum + (rud.dollar || 0);
      }
    }, 0);

    // 손익 계산
    const profit = totalValue - (account.principal / currentExchangeRate);
    const profitPercent = (profit / (account.principal / currentExchangeRate)) * 100;

    // 일일 손익을 pre_principal과 실시간 잔고의 차이로 계산
    const prePrincipalInDollars = account.pre_principal / currentExchangeRate;
    const dailyProfit = totalValue - prePrincipalInDollars;
    const dailyProfitPercent = (dailyProfit / prePrincipalInDollars) * 100;

    return {
      name: account.company,
      number: account.account.slice(-4),
      principal: account.principal,
      valuation: totalValue,
      dailyProfit: dailyProfit,
      dailyProfitPercent: parseFloat(dailyProfitPercent.toFixed(1)),
      totalProfit: profit,
      totalProfitPercent: profitPercent
    };
  }, [selectedAccountIndex, currentExchangeRate]);

  // 총 현금 금액
  const totalCash = useMemo(() => {
    return cashItems.reduce((sum, item) => sum + item.value, 0);
  }, [cashItems]);

  // 총 해외주식 금액
  const totalForeign = useMemo(() => {
    return foreignStocks.reduce((sum, item) => sum + item.value, 0);
  }, [foreignStocks]);

  // 총 국내주식 금액
  const totalDomestic = useMemo(() => {
    return domesticStocks.reduce((sum, item) => sum + item.value, 0);
  }, [domesticStocks]);

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
  };

  // 종목 평균 변화율 계산
  const getForeignPercentChange = useMemo(() => {
    if (foreignStocks.length === 0) return 0;
    const totalPercentChange = foreignStocks.reduce((sum, stock) => sum + stock.percentChange, 0);
    return parseFloat((totalPercentChange / foreignStocks.length).toFixed(1));
  }, [foreignStocks]);

  const getDomesticPercentChange = useMemo(() => {
    if (domesticStocks.length === 0) return 0;
    const totalPercentChange = domesticStocks.reduce((sum, stock) => sum + stock.percentChange, 0);
    return parseFloat((totalPercentChange / domesticStocks.length).toFixed(1));
  }, [domesticStocks]);

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
          <Text style={[styles.profitText, accountInfo.totalProfit < 0 ? styles.lossText : styles.gainText]}>
            {currencyType === 'won'
              ? `${Math.round(accountInfo.totalProfit * currentExchangeRate).toLocaleString()}원`
              : `$${accountInfo.totalProfit.toFixed(2)}`}
            ({accountInfo.totalProfitPercent.toFixed(1)}%)
          </Text>
        </View>

        <View style={styles.dailyProfitContainer}>
          <Text style={[styles.dailyProfitText, styles.gainText]}>
            일간 수익
            {currencyType === 'won'
              ? `+${Math.round(accountInfo.dailyProfit * currentExchangeRate).toLocaleString()}원`
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
        cashItems={cashItems}
        currencyType={currencyType}
        exchangeRate={currentExchangeRate}
        totalBalance={totalBalance}
        calculateCurrentPortion={calculateCurrentPortion}
      />

      {/* 해외주식 영역 */}
      <RForeignComponent
        totalAmount={totalForeign}
        percentChange={getForeignPercentChange}
        stocks={foreignStocks}
        currencyType={currencyType}
        exchangeRate={currentExchangeRate}
        totalBalance={totalBalance}
        calculateCurrentPortion={calculateCurrentPortion}
      />

      {/* 국내주식 영역 */}
      <RDomesticComponent
        totalAmount={totalDomestic}
        percentChange={getDomesticPercentChange}
        stocks={domesticStocks}
        currencyType={currencyType}
        exchangeRate={currentExchangeRate}
        totalBalance={totalBalance}
        calculateCurrentPortion={calculateCurrentPortion}
      />
    </ScrollView>
  );
};

export default withTheme(RebalancingComponent);
