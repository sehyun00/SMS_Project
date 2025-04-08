import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 컴포넌트 props 인터페이스 정의
interface RecordComponentProps {
  // 필요한 경우 여기에 props 타입 추가
}

// React.FC를 사용해 함수 컴포넌트 타입 지정
const RecordComponent: React.FC<RecordComponentProps> = () => {
  return (
    <View>
      <Text>기록 화면</Text>
    </View>
  );
};

export default RecordComponent;
