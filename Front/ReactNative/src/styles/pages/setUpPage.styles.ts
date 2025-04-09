// 경로: src/styles/pages/setUpPage.styles.ts
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../types/theme';

// 스타일 타입 정의
interface SetUpPageStyles {
  container: ViewStyle;
  header: ViewStyle;
  headerTitle: TextStyle;
  divider: ViewStyle;
  section: ViewStyle;
  sectionTitle: TextStyle;
}

export default function createStyles(theme: Theme): SetUpPageStyles {
  return StyleSheet.create<SetUpPageStyles>({
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
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14,
      color: theme.colors.placeholder,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.card,
    }
  });
}
