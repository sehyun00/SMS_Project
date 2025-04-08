// 경로: src/styles/common.styles.js
import { StyleSheet } from 'react-native';

// 테마를 받아 동적으로 스타일 생성하는 함수로 변경
export const createCommonStyles = (theme) => StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  defaultText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '400',
  },
  buttonStyle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 8, // 토스는 좀 더 둥근 모서리 사용
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  primaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.primary, // 토스 파란색
    borderRadius: 8,
    borderWidth: 0,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  }
});

export default createCommonStyles;
