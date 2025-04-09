// 경로: src/styles/pages/mainPage.styles.ts
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

import { Theme } from '../../types/theme';

// 스타일 타입 정의
interface MainPage {
  container: ViewStyle;
  header: ViewStyle;
  headerText: TextStyle;
  subHeader: ViewStyle;
  button: ViewStyle;
  pageName: TextStyle;
  content: ViewStyle;
  bottomNav: ViewStyle;
  navItem: ViewStyle;
  navText: TextStyle;
  activeNavText: TextStyle;
}


export default function createStyles(theme: Theme): MainPage {
  return StyleSheet.create<MainPage>({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    subHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      height: 56,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    button: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderColor: theme.colors.border,
    },
    pageName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    content: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    bottomNav: {
      flexDirection: 'row',
      height: 60,
      backgroundColor: theme.colors.card,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    navItem: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    navText: {
      color: theme.colors.placeholder,
      fontSize: 12,
      marginTop: 4,
    },
    activeNavText: {
      color: theme.colors.primary,
      fontWeight: '500',
    },
  });
}
