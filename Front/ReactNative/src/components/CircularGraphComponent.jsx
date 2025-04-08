import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import styles from '../styles/components/circularGraphComponent.styles';

const CircularGraphComponent = ({ data }) => {
  const chartData = data.map(item => ({
    name: item.name,
    value: item.value,
    color: item.color,
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  }));

  const chartConfig = {
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };
  
  const screenWidth = Dimensions.get('window').width;
  const centerX = screenWidth * 0.425; // 화면 중앙 값

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
          center={[Dimensions.get('window').width * 0.21, 0]}
          avoidFalseZero
        />
        <View
          style={{
            position: 'absolute',
            width: 100, // 도넛 중앙 구멍 크기
            height: 100, // 도넛 중앙 구멍 크기
            borderRadius: 50, // 원 모양을 위해 width/2로 설정
            backgroundColor: '#ffffff', // 배경색과 동일하게
            top: 75, // (250/2) - (100/2)
            left: centerX - 50, // 중앙 X - (원 너비/2)
          }}
        />
      </View>
    </View>
  );
};

export default CircularGraphComponent;
