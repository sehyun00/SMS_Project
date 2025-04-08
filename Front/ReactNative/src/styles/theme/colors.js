// 토스증권 색상을 기반으로 한 색상 팔레트
export const palette = {
    tossBlue: '#0064FF',
    tossGray: '#202632',
    black: '#000000',
    white: '#FFFFFF',
    gray100: '#F5F6FA',
    gray200: '#EAEBF0',
    gray300: '#DADCE3',
    gray400: '#C8CAD2',
    gray500: '#A7AAAF',
    gray600: '#878B94',
    gray700: '#64676E',
    gray800: '#3F4249',
    gray900: '#252730',
  };
  
  // 라이트 모드 테마
  export const lightColors = {
    primary: palette.tossBlue,
    secondary: palette.white,
    background: palette.gray900,
    card: palette.gray800,
    text: palette.gray100,
    border: palette.gray700,
    notification: palette.tossBlue,
    placeholder: palette.gray600,
    highlight: palette.tossBlue,
    error: '#FF3B30',
    success: '#30D158',
    warning: '#FF9F0A',
  };
  
  // 다크 모드 테마
  export const darkColors = {
    primary: palette.tossBlue,
    secondary: palette.tossGray,
    background: palette.white,
    card: palette.gray100,
    text: palette.gray900,
    border: palette.gray300,
    notification: palette.tossBlue,
    placeholder: palette.gray500,
    highlight: palette.tossBlue,
    error: '#FF2D55',
    success: '#34C759',
    warning: '#FF9500',
  };
  