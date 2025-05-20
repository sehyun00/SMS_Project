// 경로: src/styles/components/myStockAccountComponent.styles.js
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

import { Theme } from '../../types/theme';

// 스타일 타입 정의
interface MyStockAccountComponent {
  container: ViewStyle;
  contentContainer: ViewStyle;
  summaryContainer: ViewStyle;
  smallTitle: TextStyle;
  totalValue: TextStyle;
  chartContainer: ViewStyle;
  stockListHeader: ViewStyle;
  sectionTitle: TextStyle;
  stockList: ViewStyle;
  accountSelectorContainer: ViewStyle;
  accountButton: ViewStyle;
  selectedAccountButton: ViewStyle;
  accountText: TextStyle;
  selectedAccountText: TextStyle;
  currencySelectorContainer: ViewStyle;
  currencyButton: ViewStyle;
  selectedCurrencyButton: ViewStyle;
  currencyText: TextStyle;
  selectedCurrencyText: TextStyle;
  stockItemContainer: ViewStyle;
  colorIndicator: ViewStyle;
  stockInfo: ViewStyle;
  stockName: TextStyle;
  stockValue: TextStyle;
  stockRatio: TextStyle;
}

export default function createStyles(theme: Theme): MyStockAccountComponent {
  return StyleSheet.create<MyStockAccountComponent>({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      paddingBottom: 30,
    },
    summaryContainer: {
      marginTop: 10,
      marginBottom: 20,
      paddingHorizontal: 16,
    },
    smallTitle: {
      color: theme.colors.placeholder,
      fontSize: 14,
      marginBottom: 4,
    },
    totalValue: {
      fontSize: 26,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    chartContainer: {
      alignItems: 'center',
      marginVertical: 20,
    },
    stockListHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 15,
      marginTop: 10,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    stockList: {
      paddingHorizontal: 16,
    },
    accountSelectorContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 16,
      paddingHorizontal: 16,
      marginTop: 10,
    },
    accountButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginRight: 8,
      marginBottom: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    selectedAccountButton: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    accountText: {
      color: theme.colors.text,
      fontSize: 13,
    },
    selectedAccountText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 13,
    },
    // 통화 선택 버튼 스타일
    currencySelectorContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 8,
      marginTop: 4,
    },
    currencyButton: {
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 16,
      borderWidth: 1,
      marginHorizontal: 8,
      borderColor: theme.colors.border,
    },
    selectedCurrencyButton: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    currencyText: {
      color: theme.colors.text,
      fontSize: 14,
    },
    selectedCurrencyText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 14,
    },
    // 종목 아이템 스타일
    stockItemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    colorIndicator: {
      width: 12,
      height: 24,
      borderRadius: 4,
      marginRight: 12,
    },
    stockInfo: {
      flex: 1,
    },
    stockName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    stockValue: {
      fontSize: 14,
      color: theme.colors.text,
    },
    stockRatio: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
  });
}
