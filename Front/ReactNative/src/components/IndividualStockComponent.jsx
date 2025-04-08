import React from 'react';
import { View, Text } from 'react-native';
import styles from '../styles/components/individualStockComponent.styles';

const IndividualStockComponent = ({ stock }) => {
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

export default IndividualStockComponent;
