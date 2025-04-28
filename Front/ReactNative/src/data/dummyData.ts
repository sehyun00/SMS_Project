// 경로: src/data/dummyData.ts

// DB 엑셀에 정의된 인터페이스 (엑셀 스키마 기반)
export interface User {
  user_id: string;
  name: string;
  password: string;
  phone_number: string;
  membership: 'COMMON_USER' | 'MEMBERSHIP_USER';
}

export interface Account {
  user_id: string;          // 유저 아이디
  account: string;          // 계좌번호
  account_password: string; // 계좌 비밀번호
  connected_id: string;     // 컨넥티드 아이디
  company: string;          // 증권사 명
  principal: number;        // 원금
  pre_principal: number;    // 전날 총잔고
}

export interface Rud {
  account: string;          // 계좌정보
  rud_date: string;         // 기록 저장 날짜
  stock_name: string;       // 종목 명 or 원화 or 달러
  expert_per: number;       // 희망 비중
  market_order?: number;     // 구매 당시 시장가: 원,달러는 null
  rate?: number;             // 수익률: 원,달러는 null
  nos?: number;              // 수량: 원,달러는 null
  won?: number;             // 원: 국내주식 종목 별 총 금액, 원화
  dollar?: number;          // 달러: 해외주식 종목 별 총 금액, 달러
  stock_region: 0 | 1 | 2;  // 0: 현금, 1: 주식, 2: 해외주식
}

// 더미 사용자 데이터
export const dummyUsers: User[] = [
  {
    user_id: 'test@example.com',
    name: '테스트사용자',
    password: 'Test@1234',
    phone_number: '01012345678',
    membership: 'COMMON_USER'
  }
];

// 더미 계좌 데이터
export const dummyAccounts: Account[] = [
  {
    user_id: 'test@example.com',
    account: '1234567890123',
    account_password: 'encrypted_pass_1',
    connected_id: 'conn_id_123456',
    company: '토스증권',
    principal: 5323773,
    pre_principal: 5400000
  },
  {
    user_id: 'test@example.com',
    account: '9876543210987',
    account_password: 'encrypted_pass_2',
    connected_id: 'conn_id_987654',
    company: '삼성증권',
    principal: 10000000,
    pre_principal: 9800000
  }
];

// 더미 거래 데이터
export const dummyRuds: Rud[] = [
  {
    account: '1234567890123',
    rud_date: '2025-04-28T15:30:00',
    stock_name: '삼성전자',
    expert_per: 15,
    market_order: 72500,
    rate: -24.9,
    nos: 15.3,
    won: 610161,
    stock_region: 1
  },
  {
    account: '1234567890123',
    rud_date: '2025-04-27T14:20:00',
    stock_name: 'CONY',
    expert_per: 15,
    market_order: 8.23,
    rate: -46.9,
    nos: 99.95,
    dollar: 822.63,
    stock_region: 2
  },
  {
    account: '1234567890123',
    rud_date: '2025-04-27T14:20:00',
    stock_name: 'SCHD',
    expert_per: 15,
    market_order: 8.23,
    rate: 14.0,
    nos: 603.95,
    dollar: 6451.63,
    stock_region: 2
  },
  {
    account: '1234567890123',
    rud_date: '2025-04-26T10:15:00',
    stock_name: '원화',
    expert_per: 5,
    won: 335499,
    stock_region: 0
  },
  {
    account: '1234567890123',
    rud_date: '2025-04-26T10:15:00',
    stock_name: '달러',
    expert_per: 5,
    dollar: 325.32,
    stock_region: 0
  },
  {
    account: '9876543210987',
    rud_date: '2025-04-28T09:45:00',
    stock_name: 'AAPL',
    expert_per: 20,
    market_order: 176.50,
    rate: 12.4,
    nos: 10,
    dollar: 1765.0,
    stock_region: 2
  }
];

// 환율 정보 (2025-04-29 기준)
export const exchangeRates = {
  USD_KRW: 1432.92,
  USD_EUR: 0.92,
  USD_JPY: 154.35,
  timestamp: '2025-04-29T01:32:00+09:00'
};

// 헬퍼 함수: 계좌 기반으로 해당 계좌의 거래 데이터 가져오기
export function getAccountRuds(accountNumber: string): Rud[] {
  return dummyRuds.filter(rud => rud.account === accountNumber);
}

// 환율 가져오는 함수
export function getCurrentExchangeRate() {
  return exchangeRates.USD_KRW;
}
