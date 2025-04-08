// src/styles/components/individualStockComponent.styles.ts
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface Theme {
  colors: {
    text: string;
    placeholder: string;
    background: string;
  };
}

// 스타일 타입 정의
interface individualStockComponent {
  container: ViewStyle;
  text: TextStyle;
}

export default function createStyles(theme: Theme): individualStockComponent {
  return StyleSheet.create<individualStockComponent>({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
    },
    colorIndicator: {
      width: 12,
      height: 12,
      marginRight: 12,
    },
    stockInfo: {
      flex: 1,
    },
    stockName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
    },
    stockValue: {
      fontSize: 14,
      color: theme.colors.placeholder,
      marginTop: 4,
    },
    stockRatio: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    }
  });
}