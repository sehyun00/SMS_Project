// 경로: src/styles/components/rebalancingComponent.styles.js
import { StyleSheet } from 'react-native';
import { Theme } from '../../types/theme';

export default function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f7',
    },
    contentContainer: {
      padding: 16,
    },
    // 계좌 선택 UI 스타일
    accountSelectorContainer: {
      flexDirection: 'row',
      marginBottom: 15,
      flexWrap: 'wrap',
    },
    accountButton: {
      paddingVertical: 8,
      paddingHorizontal: 15,
      marginRight: 10,
      marginBottom: 8,
      borderRadius: 20,
      backgroundColor: '#f0f0f0',
    },
    selectedAccountButton: {
      backgroundColor: theme.colors.primary,
    },
    accountText: {
      fontSize: 14,
      color: '#333',
    },
    selectedAccountText: {
      fontSize: 14,
      color: '#FFF',
      fontWeight: 'bold',
    },
    // 기존 스타일들
    accountContainer: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    accountTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#000',
      marginBottom: 12,
    },
    principalContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    principalLabel: {
      fontSize: 14,
      color: '#666',
      marginRight: 8,
    },
    principalValue: {
      fontSize: 14,
      fontWeight: '500',
      color: '#000',
    },
    balanceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    balanceLabel: {
      fontSize: 14,
      color: '#666',
      marginRight: 8,
    },
    balanceValue: {
      fontSize: 14,
      fontWeight: '500',
      color: '#000',
    },
    profitContainer: {
      marginBottom: 6,
    },
    profitText: {
      fontSize: 16,
      fontWeight: '700',
    },
    dailyProfitContainer: {
      marginBottom: 16,
    },
    dailyProfitText: {
      fontSize: 14,
      fontWeight: '500',
    },
    gainText: {
      color: '#37b24d',
    },
    lossText: {
      color: '#f03e3e',
    },
    currencyToggleContainer: {
      position: 'absolute',
      top: 16,
      right: 16,
      flexDirection: 'row',
      backgroundColor: '#f0f0f0',
      borderRadius: 16,
      overflow: 'hidden',
    },
    currencyButton: {
      paddingVertical: 6,
      paddingHorizontal: 14,
    },
    activeCurrency: {
      backgroundColor: theme.colors.primary,
    },
    currencyText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#666',
    },
    activeCurrencyText: {
      color: '#fff',
    },
  });
}
