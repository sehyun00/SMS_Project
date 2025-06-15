// 주식명을 주식 코드로 매핑하는 데이터
export const stockNameToCodeMapping: { [key: string]: string } = {
  // 국내 주식
  '삼성전자': '005930',
  'SK하이닉스': '000660',
  'NAVER': '035420',
  'LG에너지솔루션': '373220',
  'SK': '034730',
  'KB금융': '105560',
  '현대차': '005380',
  '기아': '000270',
  'LG화학': '051910',
  'POSCO홀딩스': '005490',
  '셀트리온': '068270',
  '한국전력': '015760',
  '신한지주': '055550',
  '하나금융지주': '086790',
  '우리금융지주': '316140',
  'SK이노베이션': '096770',
  '카카오': '035720',
  '현대모비스': '012330',
  '삼성SDI': '006400',
  'LG전자': '066570',
  '카카오뱅크': '323410',
  '크래프톤': '259960',
  '금양': '001570',
  '한화에어로스페이스': '012450',
  '코오롱인더': '120110',
  '제일기획': '030000',
  '서울식품': '004410',
  '세아제강지주': '003030',
  'SK텔레콤': '017670',
  'KT': '030200',
  'LG유플러스': '032640',
  '두산에너빌리티': '034020',
  '코오롱글로벌': '003070',
  '상신브레이크': '041650',
  '케이씨텍': '089150',
  '애경화학': '161890',
  '도화엔지니어링': '023160',
  '제넥신': '095700',
  '한화시스템': '272210',
  '롯데케미칼': '011170',
  '한진중공업': '097230',
  'KCC': '002380',
  '한국항공우주': '047810',
  '금호석유': '011780',
  '현대건설': '000720',
  '대림산업': '000210',
  '삼성물산': '028260',
  '현대엔지니어링': '000720',
  'GS': '078930',
  'GS칼텍스': '078930',
  'S-Oil': '010950',
  'CJ제일제당': '097950',
  'CJ': '001040',
  '농심': '004370',
  '오리온': '001800',
  '롯데제과': '006650',
  '동원F&B': '049770',
  '빙그레': '005180',
  '매일유업': '267980',
  '남양유업': '003920',
  '한화': '000880',
  '롯데지주': '004990',
  'GS리테일': '007070',
  '롯데쇼핑': '023530',
  '신세계': '004170',
  '현대백화점': '069960',
  'E마트': '139480',
  'BGF리테일': '282330',
  '편의점': '003410',
  '레스토랑': '024110',
  '맥도날드': '263750',
  '스타벅스': '006280',

  // 해외 주식 (미국)
  'Apple': 'AAPL',
  'Microsoft': 'MSFT',
  'Amazon': 'AMZN',
  'Google': 'GOOGL',
  'Alphabet': 'GOOGL',
  'Tesla': 'TSLA',
  'Meta': 'META',
  'Facebook': 'META',
  'Netflix': 'NFLX',
  'NVIDIA': 'NVDA',
  'JPMorgan': 'JPM',
  'Johnson & Johnson': 'JNJ',
  'Visa': 'V',
  'Procter & Gamble': 'PG',
  'UnitedHealth': 'UNH',
  'Home Depot': 'HD',
  'Mastercard': 'MA',
  'Disney': 'DIS',
  'Bank of America': 'BAC',
  'Chevron': 'CVX',
  'Coca-Cola': 'KO',
  'Walmart': 'WMT',
  'Boeing': 'BA',
  'Intel': 'INTC',
  'Cisco': 'CSCO',
  'Verizon': 'VZ',
  'Pfizer': 'PFE',
  'Oracle': 'ORCL',
  'Salesforce': 'CRM',
  'Abbott': 'ABT',
  'McDonald\'s': 'MCD',
  'Adobe': 'ADBE',
  'Broadcom': 'AVGO',
  'Costco': 'COST',
  'PayPal': 'PYPL',
  'Qualcomm': 'QCOM',
  'Texas Instruments': 'TXN',
  'Union Pacific': 'UNP',
  'Honeywell': 'HON',
  'IBM': 'IBM',
  'Lockheed Martin': 'LMT',
  'General Electric': 'GE',
  'AT&T': 'T',
  'Nike': 'NKE',
  'American Express': 'AXP',
  'Starbucks': 'SBUX',
  'Goldman Sachs': 'GS',
  'Morgan Stanley': 'MS',
  'Wells Fargo': 'WFC',
  'Citigroup': 'C',
  'Ford': 'F',
  'General Motors': 'GM',
  'Caterpillar': 'CAT',
  '3M': 'MMM',
  'Dow': 'DOW',
  'DuPont': 'DD',
  'FedEx': 'FDX',
  'UPS': 'UPS',
  'Exxon Mobil': 'XOM',
  'ConocoPhillips': 'COP',
  'Marathon Petroleum': 'MPC',
  'Valero': 'VLO',

  // ETF
  'CONY': 'CONY',
  'SCHD': 'SCHD',
  'SPY': 'SPY',
  'QQQ': 'QQQ',
  'IWM': 'IWM',
  'EEM': 'EEM',
  'VTI': 'VTI',
  'VEA': 'VEA',
  'VWO': 'VWO',
  'BND': 'BND',
  'TLT': 'TLT',
  'GLD': 'GLD',
  'SLV': 'SLV',
  'USO': 'USO',
  'DBA': 'DBA',
  'REIT': 'REIT',
  'VNQ': 'VNQ',
  'IYR': 'IYR',
  'XLF': 'XLF',
  'XLE': 'XLE',
  'XLK': 'XLK',
  'XLV': 'XLV',
  'XLP': 'XLP',
  'XLI': 'XLI',
  'XLU': 'XLU',
  'XLB': 'XLB',
  'XLRE': 'XLRE',
  'XLY': 'XLY',

  // 기본값들
  '원화': 'KRW',
  '달러': 'USD',
  '현금': 'CASH',
  '예금': 'DEPOSIT'
};

// 주식 코드를 주식명으로 역변환하는 매핑
export const stockCodeToNameMapping: { [key: string]: string } = 
  Object.fromEntries(
    Object.entries(stockNameToCodeMapping).map(([name, code]) => [code, name])
  );

// 주식명을 코드로 변환하는 함수 (부분 매칭 지원)
export const getStockCodeFromName = (stockName: string): string => {
  // 정확한 매칭 먼저 시도
  if (stockNameToCodeMapping[stockName]) {
    return stockNameToCodeMapping[stockName];
  }

  // 부분 매칭 시도 (공백 제거 후)
  const cleanedName = stockName.replace(/\s+/g, '');
  for (const [name, code] of Object.entries(stockNameToCodeMapping)) {
    if (name.replace(/\s+/g, '').includes(cleanedName) || 
        cleanedName.includes(name.replace(/\s+/g, ''))) {
      return code;
    }
  }

  // 매칭되지 않으면 원본 반환 (이미 코드일 수 있음)
  console.warn(`주식 코드를 찾을 수 없음: ${stockName}`);
  return stockName;
};

// 주식 코드를 주식명으로 변환하는 함수
export const getStockNameFromCode = (stockCode: string): string => {
  return stockCodeToNameMapping[stockCode] || stockCode;
}; 