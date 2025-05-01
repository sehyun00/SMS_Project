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
  connected_id: string;     // 컨넥티드 아이디
  company: string;          // 증권사 명
  principal?: number;        // 원금
  pre_principal?: number;    // 전날 총잔고
}

// 새로운 Record 인터페이스 추가
export interface Record {
  record_id: number;        // 리밸런싱 기록 ID
  account: string;          // 계좌번호
  record_date: string;      // 리밸런싱 저장 날짜
  total_balance: number;    // 리밸런싱 시점 총잔고
  record_name?: string;     // 리밸런싱 전략 이름
  memo?: string;            // 메모
  profit_rate?: number;     // 수익률
}

// 수정된 Rud 인터페이스
export interface Rud {
  stock_name: string;       // 종목 명 or 원화 or 달러
  record_id: number;        // 리밸런싱 기록 ID
  expert_per: number;       // 희망 비중: 기본값 0
  market_order?: number;    // 구매 당시 시장가
  rate?: number;            // 수익률
  nos?: number;             // 수량
  won?: number;             // 원화
  dollar?: number;          // 달러
  rebalance_dollar?: number; // 희망 금액
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
    account: '315411-34141-13',
    connected_id: 'conn_id_123456',
    company: '토스',
    principal: 5323773,
    pre_principal: 5400000
  },
  {
    user_id: 'test@example.com',
    account: '0345-135611-3123',
    connected_id: 'conn_id_987654',
    company: '카카오',
    principal: 10000000,
    pre_principal: 9800000
  }
];

// 더미 리밸런싱 기록 데이터
export const dummyRecords: Record[] = [
  {
    record_id: 1,
    account: '315411-34141-13',
    record_date: '2025-04-12T10:30:00',
    total_balance: 5323773,
    record_name: '공격적 포지션',
    profit_rate: -1.6
  },
  {
    record_id: 2,
    account: '315411-34141-13',
    record_date: '2025-03-15T14:45:00',
    total_balance: 5400000,
    record_name: '역추세',
    profit_rate: 2.3
  },
  {
    record_id: 3,
    account: '0345-135611-3123',
    record_date: '2025-04-17T09:20:00',
    total_balance: 2828569,
    record_name: '안정형',
    profit_rate: -0.6
  },
  {
    record_id: 4,
    account: '0345-135611-3123',
    record_date: '2025-04-14T11:10:00',
    total_balance: 2900000,
    record_name: '배당형',
    profit_rate: 2.6
  },
  {
    record_id: 5,
    account: '0345-135611-3123',
    record_date: '2025-03-29T16:25:00',
    total_balance: 2950000,
    record_name: '기본형',
    profit_rate: -5.1
  }
];

// 더미 거래 데이터 (업데이트된 구조)
export const dummyRuds: Rud[] = [
  {
    stock_name: '삼성전자',
    record_id: 1,
    expert_per: 15,
    market_order: 72500,
    rate: -24.9,
    nos: 15.3,
    won: 610161,
    rebalance_dollar: 32.16,
    stock_region: 1
  },
  {
    stock_name: 'CONY',
    record_id: 1,
    expert_per: 15,
    market_order: 8.23,
    rate: -46.9,
    nos: 99.95,
    dollar: 822.63,
    rebalance_dollar: 250.0,
    stock_region: 2
  },
  {
    stock_name: 'SCHD',
    record_id: 1,
    expert_per: 15,
    market_order: 8.23,
    rate: 14.0,
    nos: 603.95,
    dollar: 6451.63,
    rebalance_dollar: 549.37,
    stock_region: 2
  },
  {
    stock_name: '원화',
    record_id: 1,
    expert_per: 5,
    won: 335499,
    rebalance_dollar: 180.0,
    stock_region: 0
  },
  {
    stock_name: '달러',
    record_id: 1,
    expert_per: 5,
    dollar: 325.32,
    rebalance_dollar: 180.0,
    stock_region: 0
  },
  {
    stock_name: 'AAPL',
    record_id: 3,
    expert_per: 20,
    market_order: 176.50,
    rate: 12.4,
    nos: 10,
    dollar: 1765.0,
    rebalance_dollar: 235.0,
    stock_region: 2
  },
  {
    stock_name: '삼성전자',
    record_id: 2,
    expert_per: 20,
    market_order: 73200,
    rate: -10.2,
    nos: 20.5,
    won: 785400,
    rebalance_dollar: 120.0,
    stock_region: 1
  },
  {
    stock_name: 'VOO',
    record_id: 4,
    expert_per: 30,
    market_order: 435.50,
    rate: 8.2,
    nos: 15,
    dollar: 6532.5,
    rebalance_dollar: 800.0,
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

// 헬퍼 함수: 계좌 기반으로 해당 계좌의 리밸런싱 기록 가져오기
export function getAccountRecords(accountNumber: string): Record[] {
  return dummyRecords.filter(record => record.account === accountNumber);
}

// 헬퍼 함수: 특정 리밸런싱 기록의 상세 항목 가져오기
export function getRecordRuds(recordId: number): Rud[] {
  return dummyRuds.filter(rud => rud.record_id === recordId);
}

// 환율 가져오는 함수
export function getCurrentExchangeRate() {
  return exchangeRates.USD_KRW;
}

// 총 자산 계산 헬퍼 함수 (특정 리밸런싱 기록의 현재 가치 계산)
export function calculateRecordValue(recordId: number): number {
  const ruds = getRecordRuds(recordId);
  const exchangeRate = getCurrentExchangeRate();
  
  return ruds.reduce((total, rud) => {
    if (rud.stock_region === 0) { // 현금
      return total + (rud.dollar || (rud.won ? rud.won / exchangeRate : 0));
    } else if (rud.stock_region === 1) { // 국내주식
      return total + ((rud.won || 0) / exchangeRate);
    } else { // 해외주식
      return total + (rud.dollar || 0);
    }
  }, 0);
}
