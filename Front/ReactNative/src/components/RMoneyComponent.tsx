// 경로: src/components/RMoneyComponent.tsx
// 흐름도: App.js > AppNavigator.js > MainPage.jsx > RebalancingComponent.tsx > RMoneyComponent.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import withTheme from '../hoc/withTheme';
import { Theme } from '../types/theme';
import { COLUMN_WIDTHS } from '../constants/tableConfig';
import { createTableStyles } from '../styles/components/rtableComponents.styles';

interface CashItem {
  name: string;
  value: number;
  krwValue: number;
  targetPortion: number;
  rebalanceAmount: number;
}

interface RMoneyComponentProps {
  totalAmount: number;
  cashItems: CashItem[];
  currencyType: 'dollar' | 'won';
  exchangeRate: number;
  totalBalance: number;
  calculateCurrentPortion: (amount: number) => number;
  theme?: Theme;
}

const RMoneyComponent: React.FC<RMoneyComponentProps> = ({
  totalAmount,
  cashItems,
  currencyType,
  exchangeRate,
  totalBalance,
  calculateCurrentPortion,
  theme
}) => {
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
        <Text style={styles.headerTitle}>현금</Text>
        <Text style={styles.headerAmount}>
          {currencyType === 'won'
            ? `${KRW_SYMBOL}${Math.round(totalAmount * exchangeRate).toLocaleString()}`
            : `$${totalAmount.toFixed(2)}`}
        </Text>
      </View>

      <View style={styles.tableContainer}>
        {/* 고정 열 (종목명) */}
        <View style={styles.fixedColumn}>
          <View style={styles.fixedHeader}>
            <Text style={styles.headerCell}>종목명</Text>
          </View>

          {cashItems.map((item, index) => (
            <View key={index} style={styles.fixedCell}>
              <Text style={styles.cashName}>{item.name}</Text>
            </View>
          ))}
        </View>

        {/* 스크롤 가능한 열 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* 스크롤 가능한 헤더 */}
            <View style={styles.scrollableHeader}>
              <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.amount }]}>총금액</Text>
              <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.currentPortion }]}>현재 비중</Text>
              <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.targetPortion }]}>목표 비중</Text>
              <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.rebalance }]}>조정 금액</Text>
            </View>

            {/* 스크롤 가능한 데이터 행 */}
            {cashItems.map((item, index) => (
              <View key={index} style={styles.scrollableRow}>
                {/* 총금액 표시 */}
                <View style={[styles.amountColumn, { width: COLUMN_WIDTHS.amount }]}>
                  <Text style={styles.mainAmount}>
                    {currencyType === 'won'
                      ? `${KRW_SYMBOL}${Math.round(item.value * exchangeRate).toLocaleString()}`
                      : `$${item.value.toFixed(2)}`}
                  </Text>
                  <Text style={styles.subAmount}>
                    {currencyType === 'won'
                      ? `$${item.value.toFixed(2)}`
                      : `${KRW_SYMBOL}${Math.round(item.value * exchangeRate).toLocaleString()}`}
                  </Text>
                </View>
                {/* 현재 비중 표시 */}
                <Text style={[styles.portionText, { width: COLUMN_WIDTHS.currentPortion }]}>
                  {calculateCurrentPortion(item.value)}%
                </Text>
                {/* 목표 비중 표시 */}
                <Text style={[styles.targetText, { width: COLUMN_WIDTHS.targetPortion }]}>
                  {item.targetPortion}%
                </Text>
                {/* 조정 금액 표시 */}
                <View style={[styles.rebalanceColumn, { width: COLUMN_WIDTHS.rebalance }]}>
                  <Text style={[
                    styles.rebalanceText,
                    item.rebalanceAmount < 0 ? styles.negativeText : styles.positiveText
                  ]}>
                    {formatProfit(item.rebalanceAmount, currencyType)}
                  </Text>
                  {/* 조정 금액 부수 표시 */}
                  <Text style={[
                    styles.subAmount,
                    item.rebalanceAmount < 0 ? styles.subNegativeChange : styles.subPositiveChange
                  ]}>
                    {currencyType === 'won'
                      ? `$${item.rebalanceAmount.toFixed(2)}`
                      : `${KRW_SYMBOL}${Math.round(item.rebalanceAmount * exchangeRate).toLocaleString()}`}
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

export default withTheme(RMoneyComponent);
