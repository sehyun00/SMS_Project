// 경로: src/components/CircularGraphComponent.jsx
// 흐름도: App.js > AppNavigator.js > MainPage.jsx > MyStockAccountComponent.jsx > CircularGraphComponent.jsx
import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

// 스타일 임포트
import withTheme from '../hoc/withTheme';
import createStyles from '../styles/components/circularGraphComponent.styles';

const CircularGraphComponent = ({ data, theme }) => {
  const styles = createStyles(theme);

  const chartData = data.map(item => ({
    name: item.name,
    value: item.value,
    color: item.color,
    legendFontColor: theme.colors.text,
    legendFontSize: 12,
  }));

  const chartConfig = {
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };
  
  const screenWidth = Dimensions.get('window').width;
  const centerX = screenWidth * 0.425;

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
