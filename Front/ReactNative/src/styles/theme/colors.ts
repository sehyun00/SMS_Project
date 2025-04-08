// src/styles/theme/colors.ts
// 앱에서 사용되는 주요 색상 정의

// 주요 색상 정의 인터페이스
export interface Colors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  placeholder: string;
  error: string;
  success: string;
  warning: string;
  card: string;
  // 기타 필요한 색상 추가
}

// 라이트 테마(기본)
export const lightColors: Colors = {
  primary: '#365BC5', // 토스 메인 파란색
  secondary: '#FF6B35', // 보조 색상
  background: '#FFFFFF', // 배경색
  text: '#1A1A1A', // 텍스트 색상
  placeholder: '#AAAAAA', // 플레이스홀더 색상
  error: '#E53935', // 오류 색상
  success: '#4CAF50', // 성공 색상
  warning: '#FF9800', // 경고 색상
  card: '#F8F9FA', // 카드 배경색
};

// 다크 테마
export const darkColors: Colors = {
  primary: '#5A7DD6', // 토스 메인 파란색 (어두운 모드용)
  secondary: '#FF8C5F', // 보조 색상 (어두운 모드용)
  background: '#121212', // 배경색
  text: '#FFFFFF', // 텍스트 색상
  placeholder: '#777777', // 플레이스홀더 색상
  error: '#EF5350', // 오류 색상
  success: '#66BB6A', // 성공 색상
  warning: '#FFB74D', // 경고 색상
  card: '#1E1E1E', // 카드 배경색
};

export default { lightColors, darkColors };
