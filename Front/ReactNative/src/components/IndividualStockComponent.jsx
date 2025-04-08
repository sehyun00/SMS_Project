// 경로: src/components/IndividualStockComponent.jsx
// 흐름도: App.js > AppNavigator.js > MainPage.jsx > MyStockAccountComponent.jsx > IndividualStockComponent.jsx
import React from 'react';
import { View, Text } from 'react-native';

// HOC 임포트
import withTheme from '../hoc/withTheme';
import createStyles from '../styles/components/individualStockComponent.styles';

const IndividualStockComponent = ({ stock, theme }) => {
  const styles = createStyles(theme);
  
  return (
    <View style={styles.container}>
      <View style={[styles.colorIndicator, { backgroundColor: stock.color }]} />
      <View style={styles.stockInfo}>
        <Text style={styles.stockName}>{stock.name}</Text>
        <Text style={styles.stockValue}>{stock.value.toLocaleString()}원</Text>
      </View>
      <Text style={styles.stockRatio}>{stock.ratio}%</Text>
    </View>
  );
};

export default withTheme(IndividualStockComponent);
