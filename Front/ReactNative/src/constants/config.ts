import { Platform } from 'react-native';

const ip = '192.168.0.9';

export const SPRING_SERVER_URL = Platform.OS === 'web'
  ? 'http://localhost:8081/upwardright'
  : `http://${ip}:8081/upwardright`;

export const FLASK_SERVER_URL = Platform.OS === 'web'
  ? 'http://localhost:5000'
  : `http://${ip}:5000`; 