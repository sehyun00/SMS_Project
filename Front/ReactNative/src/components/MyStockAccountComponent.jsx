import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CircularGraphComponent from './CircularGraphComponent';
import IndividualStockComponent from './IndividualStockComponent';
import styles from '../styles/components/myStockAccountComponent.styles';

const MyStockAccountComponent = () => {
  const insets = useSafeAreaInsets();
  
  // 샘플 주식 데이터 (색상 없이 정의)
  const stockData = [
    { name: 'Apple', value: 340000 },
    { name: 'Banana', value: 320000 },
    { name: 'Grapes', value: 180000 },
    { name: 'Melon', value: 160000 },
    { name: 'Orange', value: 150000 },
    { name: 'Kiwi', value: 140000 },
    { name: 'Mango', value: 130000 },
    { name: 'Strawberry', value: 120000 },
    { name: 'Blueberry', value: 110000 },
    { name: 'Pineapple', value: 100000 },
    { name: 'Peach', value: 95000 },
    { name: 'Cherry', value: 90000 },
    { name: 'Watermelon', value: 85000 },
  ];
  
  // 색상 배열 정의
  const colors = [
    '#FF9AA2', // 연한 빨강 (Apple)
    '#FFD700', // 노랑 (Banana)
    '#D3A4F7', // 연한 보라 (Grapes)
    '#A8E6CF', // 연한 민트 (Melon)
    '#FF6B35', // 주황
    '#9BDC28', // 연한 녹색
    '#FFB400', // 주황노랑
    '#FF4D6D', // 핑크
    '#4A6FA5', // 파랑
    '#FFE135', // 연한 노랑
  ];
  
  // 총 자산 가치 계산
  const totalValue = stockData.reduce((total, stock) => total + stock.value, 0);
  
  // 비율 계산과 내림차순 정렬 및 색상 적용
  const stocksWithRatioAndColor = stockData
    .map(stock => ({
      ...stock,
      ratio: parseFloat(((stock.value / totalValue) * 100).toFixed(1))
    }))
    .sort((a, b) => b.value - a.value)
    .map((stock, index) => ({
      ...stock,
      color: index < 10 ? colors[index] : '#CCCCCC' // 상위 10개만 색상 적용, 나머지는 회색
    }));
  
  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 60 }} 
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>자산 개수 {stocksWithRatioAndColor.length}</Text>
      
      {/* 원형 차트 - 데이터에 이미 색상이 적용된 상태로 전달 */}
      <CircularGraphComponent data={stocksWithRatioAndColor} />
      
      {/* 모든 자산 표시 */}
      <View style={styles.stockList}>
        {stocksWithRatioAndColor.map((stock, index) => (
          <IndividualStockComponent 
            key={index} 
            stock={stock}
          />
        ))}
      </View>
    </ScrollView>
  );
};

export default MyStockAccountComponent;
