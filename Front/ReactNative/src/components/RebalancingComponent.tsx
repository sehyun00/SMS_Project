// 경로: src/components/RebalancingComponent.tsx
// 흐름도: App.js > AppNavigator.js > MainPage.jsx > RebalancingComponent.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 컴포넌트 props 인터페이스 정의
interface RebalancingComponentProps {
  // 필요한 경우 여기에 props 타입 추가
}

// React.FC를 사용해 함수 컴포넌트 타입 지정
const RebalancingComponent: React.FC<RebalancingComponentProps> = () => {
  return (
    <View>
      <Text>리밸런싱 화면</Text>
    </View>
  );
};

export default RebalancingComponent;
