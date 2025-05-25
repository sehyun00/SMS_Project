// 경로: src/components/common/ui/ThemeToggle.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../styles/theme/ThemeContext';
import withTheme from '../../../hoc/withTheme';
import { Theme } from '../../../types/theme';
import createStyles from '../../../styles/components/themeToggle.styles';

// 테마 타입 정의
type ThemeType = 'light' | 'dark' | 'system';

// 테마 옵션 정의
const themeOptions: { type: ThemeType; label: string }[] = [
  { type: 'light', label: '라이트 모드' },
  { type: 'dark', label: '다크 모드' },
  { type: 'system', label: '시스템 설정과 같이' },
];

interface ThemeToggleProps {
  theme: Theme;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme }) => {
  const { isDark, setTheme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);

  // 현재 선택된 테마 타입
  const currentTheme: ThemeType = isDark ? 'dark' : 'light';

  // 테마 변경 핸들러
  const handleThemeChange = (type: ThemeType) => {
    switch (type) {
      case 'light':
        setTheme('light');
        break;
      case 'dark':
        setTheme('dark');
        break;
      case 'system':
        // 시스템 테마 설정 로직 구현 필요
        break;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>테마</Text>
        <View style={styles.backButton} />
      </View>

      {/* 테마 옵션 목록 */}
      <View style={styles.optionsContainer}>
        {themeOptions.map((option) => (
          <TouchableOpacity
            key={option.type}
            style={styles.optionItem}
            onPress={() => handleThemeChange(option.type)}
          >
            <Text style={styles.optionText}>
              {option.label}
            </Text>
            <View style={styles.radioOuter}>
              {currentTheme === option.type && (
                <View style={styles.radioInner} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default withTheme(ThemeToggle);
