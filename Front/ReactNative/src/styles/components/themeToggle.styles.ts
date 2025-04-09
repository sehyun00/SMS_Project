// 경로: src/styles/components/themeToggle.styles.ts
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../types/theme';

// 스타일 타입 정의
interface ThemeToggleStyles {
  container: ViewStyle;
  header: ViewStyle;
  headerTitle: TextStyle;
  backButton: ViewStyle;
  label: TextStyle;
  button: ViewStyle;
  buttonText: TextStyle;
}

export default function createStyles(theme: Theme): ThemeToggleStyles {
  return StyleSheet.create<ThemeToggleStyles>({
    container: {
      margin: 16,
      padding: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.card,
      shadowColor: theme.colors.text,
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      height: 56,
      borderBottomWidth: 1,
      backgroundColor: theme.colors.background,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.text,
    },
    button: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
