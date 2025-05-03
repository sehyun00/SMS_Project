import axios from 'axios';
import { FLASK_SERVER_URL } from '../constants/config';

export const fetchAccountData = async () => {
  try {
    const response = await axios.get(`${FLASK_SERVER_URL}/accounts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching account data:', error);
    throw error;
  }
};

export const fetchRebalancingRecords = async () => {
  try {
    const response = await axios.get(`${FLASK_SERVER_URL}/rebalancing-records`);
    return response.data;
  } catch (error) {
    console.error('Error fetching rebalancing records:', error);
    throw error;
  }
}; 