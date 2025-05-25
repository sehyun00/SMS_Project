import axios from 'axios';
import { FLASK_SERVER_URL } from '../constants/config';
import { BalanceInfo, BaseStockItem, BalanceRequestParams } from '../types';

export const getAccountBalance = async (params: BalanceRequestParams): Promise<BalanceInfo> => {
  try {
    console.log('계좌 잔고 조회 요청:', {
      ...params,
      account_password: '******' // 보안을 위해 마스킹
    });

    const response = await axios.post(`${FLASK_SERVER_URL}/stock/balance`, params, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('잔고 조회 응답:', response.data);

    if (response.data.result.code === 'CF-00000') {
      const apiData = response.data.data;
      let stocks: BaseStockItem[] = [];

      // resItemList가 있는 경우 (NH투자증권 형식)
      if (apiData.resItemList) {
        stocks = (apiData.resItemList || []).map((item: any) => {
          const isForeign = 
            item.resAccountCurrency === 'USD' || 
            item.resNation === 'USA' || 
            item.resNation === 'US' || 
            (item.resMarket && ['NASDAQ', 'NYSE', 'AMEX'].includes(item.resMarket));

          const currency = item.resAccountCurrency === 'USD' ? 'USD' : 'KRW';
          const exchangeRate = 1350; // TODO: 실제 환율 API 연동 필요

          return {
            name: item.resItemName || '알 수 없음',
            price: item.resPresentAmt || '0',
            amount: item.resValuationAmt || '0',
            quantity: item.resQuantity || '0',
            availableQuantity: item.resQuantity || '0',
            isForeign,
            currency,
            originalPrice: currency === 'USD' ? item.resPresentAmt : undefined,
            originalAmount: currency === 'USD' ? item.resValuationAmt : undefined
          };
        });
      }
      // 다른 증권사 형식 처리
      else if (apiData.resAccountStock && Array.isArray(apiData.resAccountStock)) {
        stocks = apiData.resAccountStock.map((item: any) => ({
          name: item.name || item.stockName || '알 수 없음',
          price: item.price || '0',
          amount: item.amount || '0',
          quantity: item.quantity || '0',
          availableQuantity: item.availableQuantity || item.quantity || '0',
          isForeign: false,
          currency: 'KRW'
        }));
      }

      return {
        accountNumber: apiData.resAccount || params.account,
        accountName: apiData.resAccountName || params.account,
        totalAmount: apiData.rsTotAmt || apiData.rsTotValAmt || '0',
        balance: apiData.resDepositReceived || apiData.resAccountBalance || '0',
        stocks,
        usdBalance: apiData.resUSDBalance || '0'
      };
    } else {
      throw new Error(response.data.result.message || '잔고 조회 실패');
    }
  } catch (error: any) {
    console.error('계좌 잔고 조회 실패:', error);
    throw new Error(error.response?.data?.result?.message || error.message || '계좌 잔고 조회에 실패했습니다.');
  }
}; 