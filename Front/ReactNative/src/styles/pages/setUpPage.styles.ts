// 경로: src/styles/pages/setUpPage.styles.ts
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../types/theme';

// 스타일 타입 정의
interface SetUpPageStyles {
  // 공통 스타일
  container: ViewStyle;
  header: ViewStyle;
  headerTitle: TextStyle;
  divider: ViewStyle;
  sectionTitle: TextStyle;
  content: ViewStyle;
  paragraph: TextStyle;
  bottomSpacing: ViewStyle;

  // 테마 토글 스타일
  themeOptionContainer: ViewStyle;
  themeOptionText: TextStyle;
  themeSelectedIndicator: ViewStyle;
  themeUnselectedIndicator: ViewStyle;

  // 프로필/알림 페이지 스타일
  pageContainer: ViewStyle;
  pageText: TextStyle;
}

export default function createStyles(theme: Theme): SetUpPageStyles {
  return StyleSheet.create<SetUpPageStyles>({
    // 공통 스타일
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      height: 56,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    paragraph: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.text,
      marginBottom: 16,
    },
    bottomSpacing: {
      height: 40,
    },

    // 테마 토글 스타일
    themeOptionContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.card,
      borderRadius: 8,
      marginBottom: 8,
    },
    themeOptionText: {
      color: theme.colors.text,
      fontSize: 16,
    },
    themeSelectedIndicator: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.primary,
    },
    themeUnselectedIndicator: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.border,
    },

    // 프로필/알림 페이지 스타일
    pageContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 16,
    },
    pageText: {
      color: theme.colors.text,
      fontSize: 16,
      textAlign: 'center',
    },
  });
}
