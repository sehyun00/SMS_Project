// 경로: src/styles/rtableComponents.styles.ts
import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Theme } from '../../types/theme';
import { COLUMN_WIDTHS } from '../../constants/tableConfig';

// 공통으로 사용할 스타일 인터페이스 정의
export interface TableComponentStyles {
  container: ViewStyle;
  headerContainer: ViewStyle;
  headerTitle: TextStyle;
  headerAmount: TextStyle;
  categoryTitle: TextStyle;
  tableContainer: ViewStyle;
  fixedColumn: ViewStyle;
  fixedHeader: ViewStyle;
  fixedCell: ViewStyle;
  scrollableHeader: ViewStyle;
  scrollableRow: ViewStyle;
  headerCell: TextStyle;
  nameText: TextStyle;
  subText: TextStyle;
  amountColumn: ViewStyle;
  mainAmount: TextStyle;
  subAmount: TextStyle;
  portionText: TextStyle;
  targetText: TextStyle;
  rebalanceColumn: ViewStyle;
  rebalanceText: TextStyle;
  negativeText: TextStyle;
  positiveText: TextStyle;
  percentChange: TextStyle;
  totalContainer: ViewStyle;
  totalAmount: TextStyle;
  changeColumn: ViewStyle;
  changeText: TextStyle;
  valueColumn: ViewStyle;
  cashName: TextStyle;
  stockName: TextStyle;
  stockTicker: TextStyle;
  negativeChange: TextStyle;
  subNegativeChange: TextStyle;
  positiveChange: TextStyle;
  subPositiveChange: TextStyle;
}

// 공통 스타일 생성 함수
export const createTableStyles = (theme: Theme): TableComponentStyles => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  headerAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginRight: 8,
  },
  percentChange: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  tableContainer: {
    flexDirection: 'row',
  },
  fixedColumn: {
    width: COLUMN_WIDTHS.name,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  fixedHeader: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    justifyContent: 'center',
  },
  fixedCell: {
    paddingVertical: 12,
    justifyContent: 'center',
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: 8,
  },
  scrollableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  scrollableRow: {
    flexDirection: 'row',
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
  },
  headerCell: {
    fontSize: 12,
    color: theme.colors.placeholder,
    fontWeight: '500',
    padding: 8,
    textAlign: 'center',
  },
  nameText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  subText: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: 2,
  },
  // 현금 항목용
  cashName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    paddingHorizontal: 8,
  },
  // 주식 항목용
  stockName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  stockTicker: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: 2,
  },
  amountColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  subAmount: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: 2,
  },
  portionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    textAlign: 'center',
  },
  targetText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    textAlign: 'center',
  },
  rebalanceColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rebalanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  negativeText: {
    color: theme.colors.negative,
  },
  positiveText: {
    color: theme.colors.positive,
  },
  changeColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  valueColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  negativeChange: {
    color: theme.colors.negative,
  },
  subNegativeChange: {
    color: theme.colors.negative+ '99',
  },
  positiveChange: {
    color: theme.colors.positive,
  },
  subPositiveChange: {
    color: theme.colors.positive + '99',
  },
});
