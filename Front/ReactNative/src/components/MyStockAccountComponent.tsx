// 파일 경로: src/components/MyStockAccountComponent.tsx
// 컴포넌트 흐름: App.js > AppNavigator.js > MainPage.jsx > MyStockAccountComponent.tsx

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 컴포넌트 임포트
import CircularGraphComponent from './CircularGraphComponent';
import IndividualStockComponent from './IndividualStockComponent';

// 스타일 임포트
import withTheme from '../hoc/withTheme';
import createStyles from '../styles/components/myStockAccountComponent.styles';
// 공통 Theme 타입 가져오기
import { Theme } from '../types/theme';

// 주식 데이터 인터페이스 정의
interface StockData {
  name: string;
  value: number;
}

// 비율과 색상이 추가된 주식 데이터 인터페이스
interface StockWithRatioAndColor extends StockData {
  ratio: number;
  color: string;
}

// 컴포넌트 props 인터페이스 정의
interface MyStockAccountComponentProps {
  theme: Theme;
}

// React.memo를 사용하여 불필요한 리렌더링 방지
const MyStockAccountComponent: React.FC<MyStockAccountComponentProps> = React.memo(({ theme }) => {
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  
  // 샘플 주식 데이터 (색상 없이 정의)
  const stockData: StockData[] = [
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
  const colors: string[] = [
    theme.colors.primary, // 토스 메인 파란색
    '#FF6B35',  // 주황
    '#4CAF50',  // 녹색
    '#9C27B0',  // 보라
    '#FF9800',  // 주황색
    '#00BCD4',  // 청록색
    '#E91E63',  // 분홍색
    '#FFEB3B',  // 노란색
    '#607D8B',  // 파란회색
    '#8BC34A',  // 연두색
  ];
  
  // 총 자산 가치 계산
  const totalValue: number = stockData.reduce((total, stock) => total + stock.value, 0);
  
  // 비율 계산과 내림차순 정렬 및 색상 적용
  const stocksWithRatioAndColor: StockWithRatioAndColor[] = stockData
    .map(stock => ({
      ...stock,
      ratio: parseFloat(((stock.value / totalValue) * 100).toFixed(1))
    }))
    .sort((a, b) => b.value - a.value)
    .map((stock, index) => ({
      ...stock,
      color: index < 10 ? colors[index] : theme.colors.placeholder // 상위 10개만 색상 적용, 나머지는 테마에 맞는 색상
    }));
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer} 
      showsVerticalScrollIndicator={false}
    >
      {/* 요약 정보 영역 */}
      <View style={styles.summaryContainer}>
        <Text style={styles.smallTitle}>총 보유자산</Text>
        <Text style={styles.totalValue}>{totalValue.toLocaleString()}원</Text>
      </View>
      
      {/* 원형 차트 영역 */}
      <View style={styles.chartContainer}>
        <CircularGraphComponent data={stocksWithRatioAndColor} />
      </View>
      
      {/* 종목 리스트 헤더 */}
      <View style={styles.stockListHeader}>
        <Text style={styles.sectionTitle}>보유종목 {stocksWithRatioAndColor.length}</Text>
      </View>
      
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
});

// 디버깅을 위한 컴포넌트 이름 설정
MyStockAccountComponent.displayName = 'MyStockAccountComponent';

export default withTheme(MyStockAccountComponent);
