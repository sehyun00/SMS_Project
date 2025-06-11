import { Platform } from 'react-native';

// const ip = '192.168.0.3';
// const ip = '10.20.32.211';
const ip = '10.20.38.84';

// Codef API 더미 모드 설정 (11일까지 API 작동 안함)
export const USE_CODEF_DUMMY_DATA = true; // 11일 이후에는 false로 변경

export const SPRING_SERVER_URL = Platform.OS === 'web'  // 스프링 백엔드 서버
  ? 'http://localhost:8081/upwardright'
  : `http://${ip}:8081/upwardright`;

export const FLASK_SERVER_URL = Platform.OS === 'web'  // Flask 서버 - 코뎁 api
  ? 'http://localhost:5000'
  : `http://${ip}:5000`; 

export const FASTAPI_SERVER_URL = Platform.OS === 'web'  // FastAPI 서버 - 주식 조회 api
  ? 'http://localhost:5001'
  : `http://${ip}:5001`; 