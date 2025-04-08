// src/styles/components/individualStockComponent.styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 0,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 12,
  },
  stockInfo: {
    flex: 1,
  },
  stockName: {
    fontSize: 16,
    fontWeight: '500',
  },
  stockValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  stockRatio: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  }
});
