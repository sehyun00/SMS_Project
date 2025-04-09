// 경로: styles/components/homeComponent.styles.ts
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

import { Theme } from '../../types/theme';

// 스타일 타입 정의
interface HomeComponent {
  container: ViewStyle;
  text: TextStyle;
}

export default function createStyles(theme: Theme): HomeComponent {
  return StyleSheet.create<HomeComponent>({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      fontSize: 18,
    },

  });
}
