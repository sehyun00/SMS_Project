// src/styles/rtableComponents.styles.ts
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
  positiveChange: TextStyle;
}

// 공통 스타일 생성 함수
export const createTableStyles = (theme: Theme): TableComponentStyles => StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
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
    color: '#333',
    marginBottom: 4,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  headerAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginRight: 8,
  },
  percentChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  tableContainer: {
    flexDirection: 'row',
  },
  fixedColumn: {
    width: COLUMN_WIDTHS.name,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  fixedHeader: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    justifyContent: 'center',
  },
  fixedCell: {
    paddingVertical: 12,
    justifyContent: 'center',
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 8,
  },
  scrollableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scrollableRow: {
    flexDirection: 'row',
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  headerCell: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
    padding: 8,
    textAlign: 'center',
  },
  nameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  subText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  // 현금 항목용
  cashName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 8,
  },
  // 주식 항목용
  stockName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  stockTicker: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  amountColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  subAmount: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  portionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  targetText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  rebalanceText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  negativeText: {
    color: '#f03e3e',
  },
  positiveText: {
    color: '#37b24d',
  },
  changeColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  valueColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  negativeChange: {
    color: '#f03e3e',
  },
  positiveChange: {
    color: '#37b24d',
  },
});
