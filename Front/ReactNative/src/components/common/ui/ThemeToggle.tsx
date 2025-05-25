// 경로: src/components/common/ui/ThemeToggle.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../styles/theme/ThemeContext';
import withTheme from '../../../hoc/withTheme';
import createStyles from '../../../styles/components/themeToggle.styles';
import { Theme } from '../../../types/theme';

// 테마 타입 정의
type ThemeType = 'light' | 'dark' | 'system';

// 컴포넌트 props 인터페이스 정의
interface ThemeToggleProps {
  theme: Theme; // withTheme HOC에서 주입되는 theme prop
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme }) => {
  const { isDark, toggleTheme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets(); 
  const styles = createStyles(theme);

  // 현재 테마 타입 계산 (isDark 값에 기반)
  const themeType: ThemeType = isDark ? 'dark' : 'light';

  // 테마 전환 함수
  const handleToggleTheme = (): void => {
    toggleTheme(); // ThemeContext에서 제공하는 토글 함수 사용
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      {/* 헤더 부분 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>테마 설정</Text>
        <View style={styles.backButton} />
      </View>
      
      {/* 기존 컨텐츠 */}
      <View style={styles.container}>
        <Text  style={{ color: theme.colors.text }}>
          테마: {themeType === 'light' ? '라이트' : '다크'}
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleToggleTheme}
        >
          <Text style={styles.buttonText}>테마 변경</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default withTheme(ThemeToggle);
