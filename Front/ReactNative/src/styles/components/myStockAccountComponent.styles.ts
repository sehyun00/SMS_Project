// 경로: src/styles/components/myStockAccountComponent.styles.js
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface Theme {
  colors: {
    text: string;
    placeholder: string;
    background: string;
  };
}

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
}

export default function createStyles(theme: Theme): MyStockAccountComponent {
  return StyleSheet.create<MyStockAccountComponent>({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      padding: 20,
    },
    summaryContainer: {
      marginBottom: 24,
    },
    smallTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.placeholder,
      marginBottom: 4,
    },
    totalValue: {
      fontSize: 26,
      fontWeight: '700',
      color: theme.colors.text,
    },
    chartContainer: {
      padding: 20,
      marginBottom: 24,
    },
    stockListHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    stockList: {
      overflow: 'hidden',
    },
  });
}
