// 경로: src/components/IndividualStockComponent.tsx
// 흐름도: App.js > AppNavigator.js > MainPage.jsx > MyStockAccountComponent.jsx > IndividualStockComponent.tsx
import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';

// HOC 임포트
import withTheme from '../hoc/withTheme';
import createStyles from '../styles/components/individualStockComponent.styles';

// 주식 데이터 인터페이스 정의
interface Stock {
  color: string;
  name: string;
  value: number;
  ratio: number;
}

// 테마 인터페이스 정의
interface Theme {
  colors: {
    text: string;
    background: string;
    // 기타 테마 관련 속성들
  };
  // 기타 테마 속성들
}

// 컴포넌트 props 인터페이스 정의
interface IndividualStockComponentProps {
  stock: Stock;
  theme: Theme;
}

const IndividualStockComponent: React.FC<IndividualStockComponentProps> = ({ stock, theme }) => {
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
