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
  user_id: string;          // 유저 아이디
  record_date: string;      // 리밸런싱 저장 날짜
  total_balance: number;    // 리밸런싱 시점 총잔고
  record_name: string;      // 리밸런싱 전략 이름
  memo: string;            // 메모
  profit_rate: number;     // 수익률
}

// 수정된 Rud 인터페이스
export interface Rud {
  record_id: number;        // 리밸런싱 기록 ID
  stock_name: string;       // 종목 명 or 원화 or 달러
  expert_per: number;       // 희망 비중: 기본값 0
  market_order: number;     // 구매 당시 시장가
  rate: number;            // 수익률
  nos: number;             // 수량
  won: number;             // 원화
  dollar: number;          // 달러
  rebalancing_dollar: number; // 희망 금액
  stock_region: number;     // 0: 현금, 1: 국내주식, 2: 해외주식
  market_type_name: string; // 시장 유형 이름
}

// Codef API 관련 인터페이스 추가
export interface ConnectedAccount {
  connectedId: string;
  accountNumber: string;
}

export interface AccountInfo {
  accountNumber: string;
  company: string;
  returnRate: number;
}

export interface StockItem {
  name: string;               // 종목명
  price: string;              // 현재가
  quantity: string;           // 보유수량
  amount: string;             // 평가금액
  availableQuantity: string;  // 거래가능수량
  [key: string]: any;         // 기타 필드
}

export interface BalanceInfo {
  accountNumber?: string;     // 계좌번호
  accountName?: string;       // 계좌명
  totalAmount?: string;       // 총평가금액
  balance?: string;           // 예수금
  stocks?: StockItem[];       // 보유주식 상세정보
  [key: string]: any;         // 기타 응답 필드
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

// Codef API 관련 더미 데이터
export const DUMMY_CONNECTED_ACCOUNTS: ConnectedAccount[] = [
  { connectedId: 'dummy_conn_1', accountNumber: '20901920648' },
  { connectedId: 'dummy_conn_2', accountNumber: '716229952301' }
];

export const DUMMY_STOCK_ACCOUNTS: AccountInfo[] = [
  { accountNumber: "20901920648", company: "NH투자증권 모바일증권 나무", returnRate: 8.5 },
  { accountNumber: "716229952301", company: "삼성증권", returnRate: 12.3 }
];

export const DUMMY_BALANCE_DATA: { [accountNumber: string]: BalanceInfo } = {
  "20901920648": {
    accountNumber: "20901920648",
    accountName: "NH투자증권 계좌",
    totalAmount: "1,250,000",
    balance: "150,000",
    stocks: [
      {
        name: "삼성전자",
        price: "72,500",
        quantity: "10",
        amount: "725,000",
        availableQuantity: "10"
      },
      {
        name: "LG에너지솔루션",
        price: "425,000",
        quantity: "1",
        amount: "425,000",
        availableQuantity: "1"
      }
    ]
  },
  "716229952301": {
    accountNumber: "716229952301",
    accountName: "삼성증권 계좌",
    totalAmount: "2,340,000",
    balance: "340,000",
    stocks: [
      {
        name: "SK하이닉스",
        price: "125,000",
        quantity: "8",
        amount: "1,000,000",
        availableQuantity: "8"
      },
      {
        name: "NAVER",
        price: "200,000",
        quantity: "5",
        amount: "1,000,000",
        availableQuantity: "5"
      }
    ]
  }
};

// 홈 API 관련 더미 데이터
export const DUMMY_ACCOUNT_DATA = [
  {
    accountNumber: "20901920648",
    company: "NH투자증권 모바일증권 나무",
    balance: "1,250,000",
    lastUpdated: new Date().toISOString()
  },
  {
    accountNumber: "716229952301", 
    company: "삼성증권",
    balance: "2,340,000",
    lastUpdated: new Date().toISOString()
  }
];

export const DUMMY_REBALANCING_RECORDS = [
  {
    id: 1,
    accountNumber: "20901920648",
    date: "2024-01-15",
    portfolioName: "안정형 포트폴리오",
    totalBalance: "1,250,000",
    profitRate: 8.5,
    memo: "정기 리밸런싱"
  },
  {
    id: 2,
    accountNumber: "716229952301",
    date: "2024-01-10",
    portfolioName: "성장형 포트폴리오", 
    totalBalance: "2,340,000",
    profitRate: 12.3,
    memo: "시장 상황에 따른 조정"
  }
];

// 더미 리밸런싱 기록 데이터
export const dummyRecords: Record[] = [
  {
    record_id: 1,
    account: '315411-34141-13',
    user_id: 'test@example.com',
    record_date: '2025-04-12T10:30:00',
    total_balance: 5323773,
    record_name: '공격적 포지션',
    memo: '공격적 포지션으로 리밸런싱',
    profit_rate: -1.6
  },
  {
    record_id: 2,
    account: '315411-34141-13',
    user_id: 'test@example.com',
    record_date: '2025-03-15T14:45:00',
    total_balance: 5400000,
    record_name: '역추세',
    memo: '역추세 전략 적용',
    profit_rate: 2.3
  },
  {
    record_id: 3,
    account: '0345-135611-3123',
    user_id: 'test@example.com',
    record_date: '2025-04-17T09:20:00',
    total_balance: 2828569,
    record_name: '안정형',
    memo: '안정형 포트폴리오',
    profit_rate: -0.6
  },
  {
    record_id: 4,
    account: '0345-135611-3123',
    user_id: 'test@example.com',
    record_date: '2025-04-14T11:10:00',
    total_balance: 2900000,
    record_name: '배당형',
    memo: '배당주 중심 포트폴리오',
    profit_rate: 2.6
  },
  {
    record_id: 5,
    account: '0345-135611-3123',
    user_id: 'test@example.com',
    record_date: '2025-03-29T16:25:00',
    total_balance: 2950000,
    record_name: '기본형',
    memo: '기본 포트폴리오',
    profit_rate: -5.1
  }
];

// 더미 거래 데이터 (업데이트된 구조) - linter 에러 수정
export const dummyRuds: Rud[] = [
  {
    record_id: 1,
    stock_name: '삼성전자',
    expert_per: 15,
    market_order: 72500,
    rate: -24.9,
    nos: 15,
    won: 610161,
    dollar: 0,
    rebalancing_dollar: 32.16,
    stock_region: 1,
    market_type_name: 'KOSPI'
  },
  {
    record_id: 1,
    stock_name: 'CONY',
    expert_per: 15,
    market_order: 8.23,
    rate: -46.9,
    nos: 100,
    won: 0,
    dollar: 822.63,
    rebalancing_dollar: 250.0,
    stock_region: 2,
    market_type_name: 'NYSE'
  },
  {
    record_id: 1,
    stock_name: 'SCHD',
    expert_per: 15,
    market_order: 8.23,
    rate: 14.0,
    nos: 604,
    won: 0,
    dollar: 6451.63,
    rebalancing_dollar: 549.37,
    stock_region: 2,
    market_type_name: 'NYSE'
  },
  {
    record_id: 1,
    stock_name: '원화',
    expert_per: 5,
    market_order: 0,
    rate: 0,
    nos: 0,
    won: 335499,
    dollar: 0,
    rebalancing_dollar: 180.0,
    stock_region: 0,
    market_type_name: 'CASH'
  },
  {
    record_id: 1,
    stock_name: '달러',
    expert_per: 5,
    market_order: 0,
    rate: 0,
    nos: 0,
    won: 0,
    dollar: 325.32,
    rebalancing_dollar: 180.0,
    stock_region: 0,
    market_type_name: 'CASH'
  },
  {
    record_id: 3,
    stock_name: 'AAPL',
    expert_per: 20,
    market_order: 176.50,
    rate: 12.4,
    nos: 10,
    won: 0,
    dollar: 1765.0,
    rebalancing_dollar: 235.0,
    stock_region: 2,
    market_type_name: 'NYSE'
  },
  {
    record_id: 2,
    stock_name: '삼성전자',
    expert_per: 20,
    market_order: 73200,
    rate: -10.2,
    nos: 20.5,
    won: 785400,
    dollar: 0,
    rebalancing_dollar: 120.0,
    stock_region: 1,
    market_type_name: 'KOSPI'
  },
  {
    record_id: 4,
    stock_name: 'VOO',
    expert_per: 30,
    market_order: 435.50,
    rate: 8.2,
    nos: 15,
    won: 0,
    dollar: 6532.5,
    rebalancing_dollar: 800.0,
    stock_region: 2,
    market_type_name: 'NYSE'
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

// 헬퍼 함수: 리밸런싱 기록 이름 업데이트
export function updateRecordName(recordId: number, newName: string): boolean {
  const record = dummyRecords.find(record => record.record_id === recordId);
  if (record) {
    record.record_name = newName;
  return true;
  }
  return false;
}

// 헬퍼 함수: 리밸런싱 기록의 상세 항목 업데이트
export function updateRecordRuds(recordId: number, assets: any[]): boolean {
  try {
    // 기존 데이터 삭제
    const index = dummyRuds.findIndex(rud => rud.record_id === recordId);
    if (index !== -1) {
      dummyRuds.splice(index, 1);
    }

    // 새로운 데이터 추가
    assets.forEach(asset => {
    // 기본 Rud 객체 생성
    const newRud: Rud = {
        record_id: recordId,
      stock_name: asset.name,
      expert_per: asset.target_percent,
        market_order: 0,
        rate: 0,
        nos: 0,
        won: 0,
        dollar: 0,
        rebalancing_dollar: 0,
        stock_region: asset.region,
        market_type_name: asset.region === 0 ? 'CASH' : asset.region === 1 ? 'KOSPI' : 'NYSE'
    };
    
      // 현금인 경우
      if (asset.region === 0) {
      if (asset.name === '원화') {
          newRud.won = asset.balance || 0;
      } else if (asset.name === '달러') {
          newRud.dollar = asset.balance || 0;
        }
      }
      // 주식인 경우
      else {
        newRud.market_order = asset.price || 0;
        newRud.rate = asset.profit_rate || 0;
        newRud.nos = asset.quantity || 0;
        if (asset.region === 1) {
          newRud.won = asset.balance || 0;
        } else {
          newRud.dollar = asset.balance || 0;
    }
  }
  
      dummyRuds.push(newRud);
    });
  
  return true;
  } catch (error) {
    console.error('더미 데이터 업데이트 실패:', error);
    return false;
  }
}

// 현재 환율 정보 가져오기
export function getCurrentExchangeRate(): number {
  return exchangeRates.USD_KRW;
}

// Codef API 관련 헬퍼 함수들
export function getCodefDummyBalance(accountNumber: string): BalanceInfo {
  return DUMMY_BALANCE_DATA[accountNumber] || {
    accountNumber: accountNumber,
    accountName: "더미 계좌",
    totalAmount: "1,000,000",
    balance: "100,000",
    stocks: [
      {
        name: "삼성전자",
        price: "72,500",
        quantity: "5",
        amount: "362,500",
        availableQuantity: "5"
      }
    ]
  };
}

export function getCodefConnectedAccounts(): ConnectedAccount[] {
  return DUMMY_CONNECTED_ACCOUNTS;
}

export function getCodefStockAccounts(): AccountInfo[] {
  return DUMMY_STOCK_ACCOUNTS;
}

export function getCodefAccountData(): any[] {
  return DUMMY_ACCOUNT_DATA;
}

export function getCodefRebalancingRecords(): any[] {
  return DUMMY_REBALANCING_RECORDS;
}

// 계좌번호로 증권사 코드 매핑 (더미용)
export function getOrganizationCodeByAccount(accountNumber: string): string {
  switch (accountNumber) {
    case "20901920648":
      return "1247"; // NH투자증권 모바일증권 나무
    case "716229952301":
      return "0240"; // 삼성증권
    default:
      return "0247"; // 기본 NH투자증권
  }
}

// 더미 데이터 연동 확인
export function isDummyModeActive(): boolean {
  // config.ts의 USE_CODEF_DUMMY_DATA 값을 참조하려면 import가 필요하지만,
  // 순환 참조를 피하기 위해 여기서는 환경변수나 다른 방법으로 확인
  return process.env.NODE_ENV === 'development' || true; // 임시로 항상 true
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

// 새로운 리밸런싱 기록 추가 함수
export function addNewRecord(accountNumber: string, recordName: string, memo: string, totalBalance: number, assets: any[]): number {
  console.log('[더미 데이터] 새로운 기록 추가 시작:', {
    accountNumber,
    recordName,
    memo,
    totalBalance,
    assetsCount: assets.length
  });
  
  // 새로운 record_id 생성 (현재 최대 ID + 1)
  const maxRecordId = Math.max(...dummyRecords.map(r => r.record_id), 0);
  const newRecordId = maxRecordId + 1;
  
  // 새로운 Record 객체 생성
  const newRecord: Record = {
    record_id: newRecordId,
    account: accountNumber,
    user_id: 'test_user', // 기본값
    record_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
    total_balance: totalBalance,
    record_name: recordName,
    memo: memo,
    profit_rate: 0 // 초기 수익률은 0
  };
  
  // dummyRecords 배열에 추가
  dummyRecords.push(newRecord);
  
  // 자산 정보를 Rud 객체로 변환하여 추가
  const exchangeRate = getCurrentExchangeRate();
  
  assets.forEach(asset => {
    const newRud: Rud = {
      record_id: newRecordId,
      stock_name: asset.name,
      expert_per: asset.target_percent || 0,
      market_order: 0,
      rate: 0,
      nos: asset.current_qty || 0,
      won: 0,
      dollar: 0,
      rebalancing_dollar: 0,
      stock_region: asset.region,
      market_type_name: asset.region === 0 ? 'CASH' : 
                       asset.region === 1 ? 'KOSPI' : 'NYSE'
    };
    
    // 지역별 금액 설정
    if (asset.region === 0) { // 현금
      if (asset.name === '원화') {
        newRud.won = asset.current_amount || 0;
      } else if (asset.name === '달러') {
        newRud.dollar = asset.current_amount || 0;
      }
    } else if (asset.region === 1) { // 국내주식
      newRud.won = asset.current_amount || 0;
      newRud.market_order = (asset.current_amount || 0) / (asset.current_qty || 1);
    } else { // 해외주식
      newRud.dollar = asset.current_amount || 0;
      newRud.market_order = (asset.current_amount || 0) / (asset.current_qty || 1);
    }
    
    dummyRuds.push(newRud);
  });
  
  console.log('[더미 데이터] 새로운 기록 추가 완료:', {
    newRecordId,
    totalRecords: dummyRecords.length,
    totalRuds: dummyRuds.length
  });
  
  return newRecordId;
}
