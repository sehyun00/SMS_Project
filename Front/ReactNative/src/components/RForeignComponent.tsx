// 경로: src/components/RForeignComponent.tsx
// 흐름도: App.js > AppNavigator.js > MainPage.jsx > RebalancingComponent.tsx > RForeignComponent.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import withTheme from '../hoc/withTheme';
import { Theme } from '../types/theme';
import { COLUMN_WIDTHS } from '../constants/tableConfig';
import { createTableStyles } from '../styles/components/rtableComponents.styles';

interface StockItem {
  name: string;
  ticker: string;
  value: number;
  krwValue: number;
  percentChange: number;
  targetPortion: number;
  rebalanceAmount: number;
}

interface RForeignComponentProps {
  totalAmount: number;
  percentChange: number;
  stocks: StockItem[];
  currencyType: 'dollar' | 'won';
  exchangeRate: number;
  totalBalance: number;
  calculateCurrentPortion: (amount: number) => number;
  theme?: Theme;
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
  const styles = createTableStyles(theme);
  
  // 원화 기호 상수
  const KRW_SYMBOL = '\u20A9';

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
                  <Text style={[styles.changeText, styles.negativeChange]}>
                    {stock.percentChange}%
                  </Text>
                </View>
                
                <View style={[styles.valueColumn, { width: COLUMN_WIDTHS.amount }]}>
                  <Text style={styles.mainAmount}>
                    {currencyType === 'won' 
                      ? `${KRW_SYMBOL}${Math.round(stock.value * exchangeRate).toLocaleString()}`
                      : `$${stock.value.toFixed(2)}`}
                  </Text>
                  <Text style={styles.subAmount}>
                    {currencyType === 'won'
                      ? `$${stock.value.toFixed(2)}`
                      : `${KRW_SYMBOL}${Math.round(stock.value * exchangeRate).toLocaleString()}`}
                  </Text>
                </View>
                
                <Text style={[styles.portionText, { width: COLUMN_WIDTHS.currentPortion }]}>
                  {calculateCurrentPortion(stock.value)}%
                </Text>
                
                <Text style={[styles.targetText, { width: COLUMN_WIDTHS.targetPortion }]}>
                  {stock.targetPortion}%
                </Text>
                
                <Text style={[
                  styles.rebalanceText, 
                  stock.rebalanceAmount < 0 ? styles.negativeChange : styles.positiveChange,
                  { width: COLUMN_WIDTHS.rebalance }
                ]}>
                  {currencyType === 'won'
                    ? `${KRW_SYMBOL}${Math.round(stock.rebalanceAmount * exchangeRate).toLocaleString()}`
                    : `$${stock.rebalanceAmount.toFixed(2)}`}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default withTheme(RForeignComponent);
