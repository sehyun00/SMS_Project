// 경로: src/components/CircularGraphComponent.tsx
// 흐름도: App.js > AppNavigator.js > MainPage.jsx > MyStockAccountComponent.jsx > CircularGraphComponent.tsx
import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

// 스타일 임포트
import withTheme from '../hoc/withTheme';
import createStyles from '../styles/components/circularGraphComponent.styles';

// 데이터 아이템 인터페이스 정의
interface DataItem {
  name: string;
  value: number;
  color: string;
}

// 차트 데이터 아이템 인터페이스 정의
interface ChartDataItem extends DataItem {
  legendFontColor: string;
  legendFontSize: number;
}

// 테마 인터페이스 정의
interface Theme {
  colors: {
    text: string;
    // 기타 테마 색상 속성들
  };
  // 기타 테마 속성들
}

// 컴포넌트 props 인터페이스 정의
interface CircularGraphComponentProps {
  data: DataItem[];
  theme: Theme;
}

const CircularGraphComponent: React.FC<CircularGraphComponentProps> = ({ data, theme }) => {
  const styles = createStyles(theme);

  const chartData: ChartDataItem[] = data.map(item => ({
    name: item.name,
    value: item.value,
    color: item.color,
    legendFontColor: theme.colors.text,
    legendFontSize: 12,
  }));

  const chartConfig = {
    color: (opacity: number = 1) => `rgba(0, 0, 0, ${opacity})`,
  };
  
  const screenWidth: number = Dimensions.get('window').width;
  const centerX: number = screenWidth * 0.425;

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <PieChart
          data={chartData}
          width={Dimensions.get('window').width * 0.85}
          height={250}
          chartConfig={chartConfig}
          accessor="value"
          backgroundColor="transparent"
          paddingLeft="0"
          absolute={false}
          hasLegend={false}
          center={[Dimensions.get('window').width * 0.215, 0]}
          avoidFalseZero
        />
      </View>
    </View>
  );
};

// HOC로 감싸서 내보내기
export default withTheme(CircularGraphComponent);
