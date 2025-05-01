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
    // 계좌 정보 스타일
    accountContainer: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
      // 리밸런싱 기록명 토글
      recordToggleContainer: {
        marginBottom: 10,
      },
      recordToggleButton: {
        paddingBottom: 8,
        borderRadius: 16,
      },
      recordToggleText: {
        fontSize: 18,
        color: '#343a40',
      },
      modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
        maxHeight: 300,
      },
      recordOption: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
      },
      recordOptionText: {
        fontSize: 15,
        color: '#222',
      },
      accountTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 12,
      },
    accountInfoRow: {
      marginBottom: 12,
      flexWrap: 'wrap',
    },
    accountInfoItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      flex: 1,
      minWidth: 80,
      marginHorizontal: 2,
    },
    infoLabel: {
      fontSize: 13,
      color: '#666',
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '500',
      color: '#000',
    },
    // 수익 색상
    profitPositive: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.positive,
    },
    profitNegative: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.negative,
    },
    // 통화 토글
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
