// src/styles/theme/index.ts
// 테마 관련 파일 통합 인덱스

import { lightColors, darkColors, Colors } from './colors';
import spacing, { Spacing } from './spacing';
import typography, { Typography } from './typography';
import { Theme } from '../../types/theme';

// 라이트 테마 (기본)
export const lightTheme: Theme = {
  colors: lightColors,
  spacing: spacing,
  fonts: typography,
  mode: 'light',
};

// 다크 테마
export const darkTheme: Theme = {
  colors: darkColors,
  spacing: spacing,
  fonts: typography,
  mode: 'dark',
};

export type { Colors, Spacing, Typography };
export { lightColors, darkColors, spacing, typography };
export default { lightTheme, darkTheme };
