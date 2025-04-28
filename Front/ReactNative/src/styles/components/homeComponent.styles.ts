// 경로: src/styles/components/homeComponent.styles.ts
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../types/theme';

// 스타일 타입 정의
interface HomeComponentStyles {
  container: ViewStyle;
  contentContainer: ViewStyle;
  sectionHeader: ViewStyle;
  sectionTitle: TextStyle;
  section: ViewStyle;
  linkText: TextStyle;
  dateText: TextStyle;
  card: ViewStyle;
  emptyCard: ViewStyle;
  emptyText: TextStyle;
  accountRow: ViewStyle;
  accountLabel: TextStyle;
  accountValue: TextStyle;
  returnRow: ViewStyle;
  accountShortName: TextStyle;
  recordName: TextStyle;
  returnRatePositive: TextStyle;
  returnRateNegative: TextStyle;
  divider: ViewStyle;
  footerText: TextStyle;
}

export default function createStyles(theme: Theme): HomeComponentStyles {
  return StyleSheet.create<HomeComponentStyles>({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f7',
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 30,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    section: {
      marginTop: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#000',
    },
    linkText: {
      fontSize: 12,
      color: '#666',
    },
    dateText: {
      fontSize: 12,
      color: '#666',
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 16,
      marginBottom: 4,
    },
    emptyCard: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
    },
    emptyText: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
    },
    accountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    accountLabel: {
      fontSize: 14,
      color: '#666',
      width: 45,
    },
    accountValue: {
      fontSize: 14,
      color: '#000',
      fontWeight: '500',
    },
    returnRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
    },
    accountShortName: {
      fontSize: 14,
      fontWeight: '500',
      color: '#000',
    },
    recordName: {
      fontSize: 14,
      fontWeight: '500',
      color: '#000',
    },
    returnRatePositive: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FF3B30', // 양수 수익률은 빨간색 (한국 주식 앱 스타일)
    },
    returnRateNegative: {
      fontSize: 14,
      fontWeight: '600',
      color: '#007AFF', // 음수 수익률은 파란색 (한국 주식 앱 스타일)
    },
    divider: {
      height: 1,
      backgroundColor: '#f0f0f0',
      marginVertical: 6,
    },
    footerText: {
      fontSize: 12,
      color: '#999',
      textAlign: 'center',
      marginTop: 20,
    }
  });
}
