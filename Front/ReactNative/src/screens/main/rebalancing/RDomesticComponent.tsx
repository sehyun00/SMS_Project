// 파일 경로: src/components/RDomesticComponent.tsx
// 컴포넌트 흐름: App.js > AppNavigator.js > MainPage.jsx > RebalancingComponent.tsx > RDomesticComponent.tsx

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import withTheme from '../../../hoc/withTheme';
import { Theme } from '../../../types/theme';
import { COLUMN_WIDTHS } from '../../../constants/tableConfig';
import { createTableStyles } from '../../../styles/components/rtableComponents.styles';

// 주식 데이터 인터페이스
interface StockItem {
  name: string;
  ticker: string;
  value: number;
  krwValue: number;
  percentChange: number;
  targetPortion: number;
  rebalanceAmount: number;
  market_order?: number;
  currentPrice?: number;  // 현재 주식 가격
  requiredShares?: number; // 필요한 주식 수 (+ 매수, - 매도)
}

interface RDomesticComponentProps {
  totalAmount: number;
  percentChange: number;
  stocks: StockItem[];
  currencyType: 'dollar' | 'won';
  exchangeRate: number;
  totalBalance: number;
  calculateCurrentPortion: (amount: number) => number;
  theme: Theme;
}

const RDomesticComponent: React.FC<RDomesticComponentProps> = ({
  totalAmount,
  percentChange,
  stocks,
  currencyType,
  exchangeRate,
  totalBalance,
  calculateCurrentPortion,
  theme
}) => {
  if (!theme) return null; // theme이 없으면 렌더링하지 않음
  const styles = createTableStyles(theme);

  // 원화 기호 상수
  const KRW_SYMBOL = '\u20A9';

  // 조정 금액 포맷 함수 (RebalancingComponent와 동일)
  const formatProfit = (value: number, type: 'won' | 'dollar') => {
    const sign = value > 0 ? '+' : value < 0 ? '-' : '';
    if (type === 'won') {
      return `${sign}${Math.abs(Math.round(value * exchangeRate)).toLocaleString()}원`;
    }
    return `${sign}$${Math.abs(value).toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.categoryTitle}>국내주식</Text>
        <View style={styles.totalContainer}>
          <Text style={styles.totalAmount}>
            {currencyType === 'won'
              ? `${KRW_SYMBOL}${Math.round(totalAmount * exchangeRate).toLocaleString()}`
              : `$${totalAmount.toFixed(2)}`}
          </Text>
          <Text style={[styles.percentChange, percentChange < 0 ? styles.negativeChange : styles.positiveChange]}>
            {percentChange}%
          </Text>
        </View>
      </View>

      <View style={styles.tableContainer}>
        {/* 고정 열 (종목명) */}
        <View style={styles.fixedColumn}>
          <View style={styles.fixedHeader}>
            <Text style={styles.headerCell}>종목명</Text>
          </View>

          {stocks.map((stock, index) => (
            <View key={index} style={styles.fixedCell}>
              <Text style={styles.stockName}>{stock.name}</Text>
              <Text style={styles.stockTicker}>{stock.ticker}</Text>
            </View>
          ))}
        </View>

        {/* 스크롤 가능한 열 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* 스크롤 가능한 헤더 */}
            <View style={styles.scrollableHeader}>
              <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.change }]}>등락률</Text>
              <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.amount }]}>총금액</Text>
              <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.currentPortion }]}>현재 비중</Text>
              <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.targetPortion }]}>목표 비중</Text>
              <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.rebalance }]}>조정 금액</Text>
            </View>

            {/* 스크롤 가능한 데이터 행 */}
            {stocks.map((stock, index) => (
              <View key={index} style={styles.scrollableRow}>
                <View style={[styles.changeColumn, { width: COLUMN_WIDTHS.change }]}>
                  <Text style={[
                    styles.changeText,
                    stock.percentChange < 0 ? styles.negativeChange : styles.positiveChange
                  ]}>
                    {stock.percentChange}%
                  </Text>
                </View>

                <View style={[styles.valueColumn, { width: COLUMN_WIDTHS.amount }]}>
                  {/* 총금액 표시 */}
                  <Text style={styles.mainAmount}>
                    {currencyType === 'won'
                      ? `${KRW_SYMBOL}${Math.round(stock.value * exchangeRate).toLocaleString()}`
                      : `$${stock.value.toFixed(2)}`}
                  </Text>
                  {/* 총금액 부수 표시 */}
                  <Text style={styles.subAmount}>
                    {currencyType === 'won'
                      ? `$${stock.value.toFixed(2)}`
                      : `${KRW_SYMBOL}${Math.round(stock.value * exchangeRate).toLocaleString()}`}
                  </Text>
                </View>
                {/* 현재 비중 표시 */}
                <Text style={[styles.portionText, { width: COLUMN_WIDTHS.currentPortion }]}>
                  {calculateCurrentPortion(stock.value)}%
                </Text>
                {/* 목표 비중 표시 */}
                <Text style={[styles.targetText, { width: COLUMN_WIDTHS.targetPortion }]}>
                  {stock.targetPortion}%
                </Text>
                {/* 조정 금액 부수 표시 */}
                <View style={[styles.rebalanceColumn, { width: COLUMN_WIDTHS.rebalance }]}>
                  <Text style={[
                    styles.rebalanceText,
                    stock.rebalanceAmount < 0 ? styles.negativeChange : styles.positiveChange,
                    { width: COLUMN_WIDTHS.rebalance }
                  ]}>
                    {formatProfit(stock.rebalanceAmount, currencyType)}
                  </Text>
                  {/* 주식 수 표시 */}
                  <Text style={[
                    styles.subAmount,
                    stock.rebalanceAmount < 0 ? styles.subNegativeChange : styles.subPositiveChange
                  ]}>
                    {stock.requiredShares !== undefined 
                      ? Math.abs(stock.requiredShares).toFixed(2)
                      : Math.abs((stock.rebalanceAmount * exchangeRate) / 50000).toFixed(2)
                    }주
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default withTheme(RDomesticComponent);
