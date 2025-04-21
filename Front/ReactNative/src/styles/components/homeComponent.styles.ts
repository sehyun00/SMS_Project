// 경로: src/styles/components/homeComponent.styles.ts
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../types/theme';

// 스타일 타입 정의
interface HomeComponentStyles {
  container: ViewStyle;
  contentContainer: ViewStyle;
  sectionTitle: TextStyle;
  dateText: TextStyle;
  card: ViewStyle;
  noAccountContainer: ViewStyle;
  noAccountText: TextStyle;
  addButton: ViewStyle;
  addButtonText: TextStyle;
  accountRow: ViewStyle;
  accountInfo: ViewStyle;
  accountCompany: TextStyle;
  accountNumber: TextStyle;
  returnRatePositive: TextStyle;
  returnRateNegative: TextStyle;
  divider: ViewStyle;
  iconContainer: ViewStyle;
  accountItemRow: ViewStyle;
  accountItem: ViewStyle;
  accountItemText: TextStyle;
}

export default function createStyles(theme: Theme): HomeComponentStyles {
  return StyleSheet.create<HomeComponentStyles>({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    dateText: {
      fontSize: 12,
      color: theme.colors.placeholder,
      marginBottom: 8,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    noAccountContainer: {
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noAccountText: {
      fontSize: 14,
      color: theme.colors.placeholder,
      marginBottom: 16,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    accountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    accountInfo: {
      flex: 1,
    },
    accountCompany: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 4,
    },
    accountNumber: {
      fontSize: 14,
      color: theme.colors.placeholder,
    },
    returnRatePositive: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FF3B30', // 양수 수익률은 빨간색
    },
    returnRateNegative: {
      fontSize: 16,
      fontWeight: '600',
      color: '#007AFF', // 음수 수익률은 파란색
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: '#F0F0F0',
    },
    accountItemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    accountItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    accountItemText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
  });
}
