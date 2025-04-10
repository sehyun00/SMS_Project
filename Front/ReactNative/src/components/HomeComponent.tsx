// 경로: src/components/HomeComponent.tsx
// 흐름도: App.js > AppNavigator.js > MainPage.jsx > HomeComponent.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Theme } from '../types/theme';
import createStyles from '../styles/components/homeComponent.styles';

// HomeComponent의 Props 타입 정의 (현재는 props가 없지만 확장성을 위해 추가)
interface HomeComponentProps {
  theme: Theme;
}

// React.FC를 사용해 함수 컴포넌트 타입 지정
const HomeComponent: React.FC<HomeComponentProps> = React.memo(({ theme })  => {
  const styles = createStyles(theme);
  return (
    <View style={styles.container}>
      <Text style={styles.text}>홈 화면</Text>
    </View>
  );
});

export default HomeComponent;
