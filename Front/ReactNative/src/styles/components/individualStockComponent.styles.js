// src/styles/components/individualStockComponent.styles.js
import { StyleSheet } from 'react-native';

export default function createStyles(theme) {
  return StyleSheet.create({
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
