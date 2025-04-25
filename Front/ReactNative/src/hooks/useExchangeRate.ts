// src/hooks/useExchangeRate.ts
import { useState, useEffect } from 'react';

export const useExchangeRate = () => {
  const [exchangeRate, setExchangeRate] = useState<number>(1400);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      setLoading(true);
      try {
        // ExchangeRate-API 사용
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        // KRW 환율 설정
        setExchangeRate(data.rates.KRW);
        setError(null);
      } catch (err) {
        setError('환율 정보를 가져오는데 실패했습니다.');
        console.error('Error fetching exchange rate:', err);
        // 기본 환율 설정 (API 호출 실패 시)
        setExchangeRate(1400); // 대략적인 USD-KRW 환율
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeRate();
    
    // 옵션: 주기적으로 환율 업데이트 (예: 1시간마다)
    const intervalId = setInterval(fetchExchangeRate, 3600000);
    
    return () => clearInterval(intervalId);
  }, []);

  return { exchangeRate, loading, error };
};
