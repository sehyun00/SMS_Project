// 경로: src/styles/pages/mainPage.styles.js
import { StyleSheet } from 'react-native';

// 테마를 사용하는 스타일로 변경
export default function createStyles(theme) {
  return StyleSheet.create({
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
