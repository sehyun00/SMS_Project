import axios from 'axios';
import { Platform } from 'react-native';
import { SPRING_SERVER_URL, FLASK_SERVER_URL } from '../constants/config';

const apiUrl = SPRING_SERVER_URL;

export const verifySocialInfo = async (payload: any) => {
  return axios.post(`${FLASK_SERVER_URL}/stock/create-and-list`, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const registerAccount = async (data: any, token: string) => {
  return axios.post(`${apiUrl}/addstockaccount`, data, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Platform': Platform.OS,
      'Authorization': token,
    },
  });
};

export const getAccountBalance = async (data: any) => {
  return axios.post(`${FLASK_SERVER_URL}/stock/balance`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}; 