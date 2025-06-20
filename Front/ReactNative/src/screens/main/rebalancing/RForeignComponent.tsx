// 파일 경로: src/components/RForeignComponent.tsx
// 컴포넌트 흐름: App.js > AppNavigator.js > MainPage.jsx > RebalancingComponent.tsx > RForeignComponent.tsx

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import withTheme from '../../../hoc/withTheme';
import { Theme } from '../../../types/theme';
import { COLUMN_WIDTHS } from '../../../constants/tableConfig';
import { createTableStyles } from '../../../styles/components/rtableComponents.styles';

interface StockItem {
  name: string;
  ticker: string;
  value: number;
  krwValue: number;
  percentChange: number;
  targetPortion: number;
  rebalanceAmount: number;
  market_order?: number;
  currentPrice?: number;
  requiredShares?: number;
}

interface RForeignComponentProps {
  totalAmount: number;
  percentChange: number;
  stocks: StockItem[];
  currencyType: 'dollar' | 'won';
  exchangeRate: number;
  totalBalance: number;
  calculateCurrentPortion: (amount: number) => number;
  theme: Theme;
}

const RForeignComponent: React.FC<RForeignComponentProps> = ({
  totalAmount,
  percentChange,
  stocks,
  currencyType,
  exchangeRate,
  totalBalance,
  calculateCurrentPortion,
  theme
}) => {
  if (!theme) return null;
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
        <Text style={styles.categoryTitle}>해외주식</Text>
        <View style={styles.totalContainer}>
          <Text style={styles.totalAmount}>
            {currencyType === 'won'
              ? `${KRW_SYMBOL}${Math.round(totalAmount * exchangeRate).toLocaleString()}`
              : `$${totalAmount.toFixed(2)}`}
          </Text>
          <Text style={[styles.percentChange, styles.negativeChange]}>{percentChange}%</Text>
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
                  {/* 주식 수 표시 - market_order 기반 계산 우선 */}
                  {stock.market_order && stock.market_order > 0 ? (
                    <Text style={[
                      styles.subAmount,
                      stock.rebalanceAmount < 0 ? styles.subNegativeChange : styles.subPositiveChange
                    ]}>
                      {Math.abs(stock.rebalanceAmount / stock.market_order).toFixed(2)}주
                    </Text>
                  ) : stock.requiredShares !== undefined && stock.currentPrice ? (
                    <Text style={[
                      styles.subAmount,
                      stock.rebalanceAmount < 0 ? styles.subNegativeChange : styles.subPositiveChange
                    ]}>
                      {Math.abs(stock.requiredShares).toFixed(2)}주
                    </Text>
                  ) : stock.rebalanceAmount !== 0 ? (
                    <Text style={[
                      styles.subAmount,
                      stock.rebalanceAmount < 0 ? styles.subNegativeChange : styles.subPositiveChange
                    ]}>
                      {Math.abs(stock.rebalanceAmount / 100).toFixed(2)}주
                    </Text>
                  ) : (
                    <Text style={[styles.subAmount, styles.subNegativeChange]}>
                      -
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default withTheme(RForeignComponent);
