// 파일 경로: src/components/portfolio/PortfolioEditor.tsx
// 컴포넌트 흐름: App.js > AppNavigator.js > MainPage.jsx > RebalancingComponent.tsx > PortfolioEditor.tsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList, PortfolioEditorNavigationProp } from '../../types/navigation';
import axios from 'axios';
import SearchModal from './SearchModal';

// API 함수 임포트
import { 
  Portfolio, 
  PortfolioItem as BasePortfolioItem,
  createPortfolio,
  updatePortfolio,
  searchStocks,
  saveRebalancingRecord,
  saveRebalancingStocks
} from '../../api/rebalancingApi';

// API 임포트 추가
import { 
  fetchConnectedAccounts, 
  getStockBalance
} from '../../api/connectedAccountApi';

import { fetchStockAccounts } from '../../api/homeApi';

// 더미 데이터 임포트
import {
  getRecordRuds,
  dummyRecords,
  getCurrentExchangeRate,
  updateRecordName,
  updateRecordRuds
} from '../../data/dummyData';

// 스타일 임포트
import withTheme from '../../hoc/withTheme';
import { Theme } from '../../types/theme';
import createStyles from '../../styles/components/portfolioEditor.styles';

// 증권사 데이터 매핑 임포트
import { findSecuritiesFirmByName } from '../../data/organizationData';

// 환경 설정 임포트
import { FLASK_SERVER_URL } from '../../constants/config';

// 계좌 정보 Context 임포트
import { useAccounts } from '../../context/AccountsContext';

// 검색 결과 항목 인터페이스
interface SearchResultItem {
  name: string;
  ticker?: string;
  region: number;
  price?: number;
}

// 임시 타입 정의 (이미 있는 경우 제거)
interface ConnectedAccount {
  connectedId: string;
}

interface AccountInfo {
  company: string;
  accountNumber: string;
  principal?: number;
  returnRate: number;
}

interface BalanceInfo {
  balance: number;
  currency: string;
}

// 컴포넌트 props 인터페이스 정의
interface PortfolioEditorProps {
  theme: Theme;
  isVisible?: boolean;
  onClose?: () => void;
  portfolioToEdit?: Portfolio; // 수정할 포트폴리오 (없으면 새로 생성)
  onSave?: (portfolio: Portfolio) => void;
}

// PortfolioItem 인터페이스 확장
interface ExtendedPortfolioItem extends BasePortfolioItem {
  // currency는 이미 BasePortfolioItem에 포함되어 있으므로 제거
}

const PortfolioEditor: React.FC<PortfolioEditorProps> = ({ 
  theme, 
  isVisible: propIsVisible, 
  onClose: propOnClose, 
  portfolioToEdit: propPortfolioToEdit,
  onSave: propOnSave
}) => {
  const { loggedToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const styles = createStyles(theme);
  
  // 네비게이션과 라우트
  const navigation = useNavigation<PortfolioEditorNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'PortfolioEditor'>>();
  
  // route.params에서 전달된 모든 정보 가져오기
  const portfolioId = route.params?.portfolioId;
  const portfolioName = route.params?.portfolioName;
  const portfolioMemo = route.params?.portfolioMemo;
  const portfolioComposition = route.params?.composition;
  const totalBalance = route.params?.totalBalance;
  const accountNumber = route.params?.accountNumber;
  const recordDate = route.params?.recordDate;
  const profitRate = route.params?.profitRate;
  const selectedAccountNumber = route.params?.selectedAccountNumber;
  const selectedAccountCompany = route.params?.selectedAccountCompany;
  
  // props나 route에서 isVisible 결정
  const [isVisible, setIsVisible] = useState(propIsVisible !== undefined ? propIsVisible : true);
  
  // 포트폴리오 상태
  const [portfolio, setPortfolio] = useState<Portfolio>({
    portfolio_name: '',
    assets: [],
    description: ''
  });

  // 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<number>(0);
  
  // 현재 수정 중인 항목 인덱스
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // 비율 합계 검증
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [isValidPercentage, setIsValidPercentage] = useState(true);
  
  // AI 추천 관련 상태 추가
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(false);
  
  // 계좌 관련 상태 추가
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [stockAccounts, setStockAccounts] = useState<AccountInfo[]>([]);
  const [balanceInfo, setBalanceInfo] = useState<Record<string, BalanceInfo>>({});
  const { accounts: savedAccounts } = useAccounts();
  
  // 고정 환율 (실제로는 API에서 가져와야 함)
  const exchangeRate = 1350; // 1 USD = 1350 KRW

  // 증권사 이름으로 기관코드 찾기
  const getOrganizationCode = (companyName: string): string => {
    const firm = findSecuritiesFirmByName(companyName);
    if (firm) {
      console.log(`증권사 ${companyName} -> 코드 ${firm.code} 변환 성공`);
      return firm.code;
    } else {
      console.warn(`증권사 코드를 찾을 수 없음: ${companyName}`);
      // 기본 코드 반환 (삼성증권)
      return '0240';
    }
  };

  // 초기화 - 두 가지 소스에서 portfolioToEdit 처리 (props와 route.params)
  useEffect(() => {
    const fetchPortfolioData = async () => {
      // props에서 직접 전달된 경우
      if (propPortfolioToEdit) {
        setPortfolio({
          ...propPortfolioToEdit,
          assets: [...propPortfolioToEdit.assets]
        });
        return;
      }
      
      // route.params에서 전체 정보가 전달된 경우 (RebalancingComponent에서 수정 버튼 클릭)
      if (portfolioId && portfolioName && portfolioComposition) {
        console.log('[포트폴리오 에디터] 전달받은 데이터:', {
          portfolioId,
          portfolioName,
          portfolioMemo,
          compositionLength: portfolioComposition.length
        });
        
        try {
          // 전달받은 composition 데이터를 ExtendedPortfolioItem으로 변환
          const portfolioAssets: ExtendedPortfolioItem[] = portfolioComposition.map(item => ({
            name: item.name,
            ticker: item.marketTypeName || undefined,
            region: item.stockRegion as 0 | 1 | 2,
            target_percent: item.targetPortion
          }));
          
          const portfolioData: Portfolio = {
            portfolio_id: portfolioId,
            portfolio_name: portfolioName,
            assets: portfolioAssets,
            description: portfolioMemo || `리밸런싱 기록에서 불러온 포트폴리오입니다.`
          };
          
          console.log('[포트폴리오 에디터] 구성된 포트폴리오 데이터:', {
            portfolioName: portfolioData.portfolio_name,
            description: portfolioData.description,
            assetsCount: portfolioData.assets.length,
            assets: portfolioData.assets
          });
          
          setPortfolio(portfolioData);
          return;
        } catch (error) {
          console.error('[포트폴리오 에디터] 전달받은 데이터 처리 오류:', error);
        }
      }
      
      // route.params에서 ID만 전달된 경우 (기존 로직)
      if (portfolioId) {
        try {
          // dummyData에서 해당 portfolioId(recordId)의 상세 데이터 가져오기
          const recordRuds = getRecordRuds(portfolioId);
          
          // 레코드 이름 찾기
          const recordInfo = dummyRecords.find(r => r.record_id === portfolioId);
          const recordName = recordInfo?.record_name || `포트폴리오 ${portfolioId}`;
          
          // 포트폴리오 객체 구성
          const portfolioAssets: ExtendedPortfolioItem[] = recordRuds.map(rud => ({
            name: rud.stock_name,
            ticker: rud.market_order ? `${rud.stock_name}` : undefined,
            region: rud.stock_region as 0 | 1 | 2,
            target_percent: rud.expert_per
          }));
          
          const portfolioData: Portfolio = {
            portfolio_id: portfolioId,
            portfolio_name: recordName,
            assets: portfolioAssets,
            description: `리밸런싱 기록 ID ${portfolioId}에서 가져온 데이터입니다.`
          };
          
          setPortfolio(portfolioData);
        } catch (error) {
          console.error('포트폴리오 정보 로딩 에러:', error);
          Alert.alert('오류', '포트폴리오 정보를 불러올 수 없습니다.');
          
          // 에러 발생 시 기본 포트폴리오 생성
          setPortfolio({
            portfolio_name: `포트폴리오 ${portfolioId}`,
            assets: [
              { name: '원화', region: 0, target_percent: 50 },
              { name: '달러', region: 0, target_percent: 50 }
            ],
            description: '기본 포트폴리오 구성'
          });
        }
        return;
      }
      
      // 새 포트폴리오 생성 (기본값 설정)
      setPortfolio({
        portfolio_name: '',
        assets: [
          { name: '원화', region: 0, target_percent: 50 },
          { name: '달러', region: 0, target_percent: 50 }
        ],
        description: ''
      });
    };
    
    fetchPortfolioData();
  }, [propPortfolioToEdit, portfolioId, portfolioName, portfolioComposition, portfolioMemo, propIsVisible]);

  // 총 비율 계산 및 검증
  useEffect(() => {
    const total = portfolio.assets.reduce((sum, item) => sum + item.target_percent, 0);
    setTotalPercentage(total);
    setIsValidPercentage(total === 100);
  }, [portfolio.assets]);

  // 항목 비율 변경 핸들러
  const handlePercentChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newAssets = [...portfolio.assets];
    newAssets[index].target_percent = numValue;
    setPortfolio({ ...portfolio, assets: newAssets });
  };

  // 항목 삭제 핸들러
  const handleRemoveItem = (index: number) => {
    const newAssets = [...portfolio.assets];
    newAssets.splice(index, 1);
    setPortfolio({ ...portfolio, assets: newAssets });
  };

  // 항목 추가 모달 열기
  const handleAddItem = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchModalVisible(true);
  };

  // 주식 검색 함수
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      // 현금 항목 (region이 0인 경우)
      if (selectedRegion === 0) {
        setSearchResults([
          { name: '원화', ticker: 'KRW', region: 0 },
          { name: '달러', ticker: 'USD', region: 0 }
        ]);
        return;
      }

      // FastAPI 서버에 검색 요청
      const response = await axios.get(`http://localhost:5001/api/stocks/search`, {
        params: {
          query: searchQuery,
          region: selectedRegion.toString()
        }
      });

      if (response.data.success && response.data.data) {
        setSearchResults(response.data.data);
      } else {
        console.error('검색 실패:', response.data.message);
        Alert.alert('검색 오류', '종목 검색 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('검색 에러:', error);
      Alert.alert('검색 오류', '종목 검색 중 오류가 발생했습니다.');
    } finally {
      setSearchLoading(false);
    }
  };

  // 검색 결과 항목 선택 핸들러
  const handleSelectSearchItem = (item: SearchResultItem) => {
    const newItem: ExtendedPortfolioItem = {
      name: item.name,
      ticker: item.ticker,
      region: item.region as 0 | 1 | 2,
      target_percent: 0
    };
    
    if (editingItemIndex !== null) {
      // 기존 항목 수정
      const newAssets = [...portfolio.assets];
      newAssets[editingItemIndex] = newItem;
      setPortfolio({ ...portfolio, assets: newAssets });
      setEditingItemIndex(null);
    } else {
      // 새 항목 추가
      setPortfolio({
        ...portfolio,
        assets: [...portfolio.assets, newItem]
      });
    }
    
    setSearchModalVisible(false);
  };

  // 포트폴리오 저장 핸들러
  const handleSave = async () => {
    console.log('handleSave function called');
    
    if (!loggedToken) {
      Alert.alert('인증 오류', '로그인이 필요합니다.');
      return;
    }

    if (!portfolio.portfolio_name.trim()) {
      console.log('Portfolio name is empty');
      Alert.alert('입력 오류', '포트폴리오 이름을 입력해주세요.');
      return;
    }
    
    if (!isValidPercentage) {
      console.log('Invalid percentage:', totalPercentage);
      Alert.alert('비율 오류', '모든 항목의 비율 합계가 100%가 되어야 합니다.');
      return;
    }
    
    if (portfolio.assets.length < 2) {
      console.log('Not enough assets:', portfolio.assets.length);
      Alert.alert('항목 오류', '최소 2개 이상의 항목이 필요합니다.');
      return;
    }

    // 전달받은 계좌 정보 우선 사용, 없으면 기본값 사용
    let accountNumber = selectedAccountNumber || '716229952301'; // 전달받은 계좌번호 또는 기본 계좌번호
    
    if (selectedAccountNumber) {
      console.log('[저장] 전달받은 계좌 사용:', selectedAccountNumber);
    } else if (stockAccounts.length > 0) {
      accountNumber = stockAccounts[0].accountNumber;
      console.log('[저장] 연결된 계좌 사용:', accountNumber);
    } else {
      console.log('[저장] 기본 계좌번호 사용:', accountNumber);
      // 계좌 정보를 다시 로드 시도
      try {
        if (loggedToken) {
          console.log('[저장] 계좌 정보 재로드 시도');
          const response = await fetchStockAccounts(loggedToken);
          if (response.success && response.data.length > 0) {
            accountNumber = response.data[0].accountNumber;
            setStockAccounts(response.data);
            console.log('[저장] 계좌 정보 재로드 성공:', accountNumber);
          }
        }
      } catch (error) {
        console.error('[저장] 계좌 정보 재로드 실패:', error);
      }
    }
    
    console.log('[저장] 사용할 계좌번호:', accountNumber);
    console.log('[저장] 전달받은 계좌번호:', selectedAccountNumber);
    console.log('[저장] 전달받은 증권사:', selectedAccountCompany);
    console.log('[저장] 토큰 상태:', loggedToken ? '있음' : '없음');
    
    setLoading(true);
    try {
      // 1. 첫 번째 API 호출 - 레코드 생성
      const totalBalance = portfolio.assets.reduce((sum, asset) => {
        const amount = asset.current_amount || 0;
        return sum + (asset.currency === 'USD' ? amount * exchangeRate : amount);
      }, 0);

      const recordData = {
        account: accountNumber,
        totalBalance: totalBalance,
        recordName: portfolio.portfolio_name,
        memo: portfolio.description || '',
        profitRate: 0 // 초기 수익률은 0으로 설정
      };

      console.log('레코드 생성 요청 데이터:', recordData);
      
      const recordResult = await saveRebalancingRecord(loggedToken, recordData);
      if (!recordResult.success) {
        if (axios.isAxiosError(recordResult.error)) {
          if (recordResult.error.response?.status === 401) {
            throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
          }
        }
        throw new Error('레코드 저장에 실패했습니다.');
      }

      console.log('레코드 생성 응답:', recordResult.data);

      const recordId = recordResult.data.record_id;
      if (!recordId) {
        throw new Error('레코드 ID를 받지 못했습니다.');
      }

      // 2. 두 번째 API 호출 - 종목 정보 저장
      const stocks = portfolio.assets.map(asset => ({
        stock_name: asset.name,
        expert_per: asset.target_percent,
        market_order: asset.region === 2 ? (asset.current_amount || 0) : (asset.current_amount || 75000),
        rate: asset.target_percent / 100,
        nos: asset.current_qty || 0,
        won: asset.currency === 'KRW' ? (asset.current_amount || 0) : 0,
        dollar: asset.currency === 'USD' ? (asset.current_amount || 0) : 0,
        rebalancing_dollar: asset.currency === 'USD' ? (asset.current_amount || 0) : 0,
        market_type: asset.region === 0 ? '현금' : (asset.region === 1 ? '국장' : '미장'),
        stock_region: asset.region
      }));

      console.log('종목 정보 저장 요청 데이터:', { recordId, stocks });

      const stocksResult = await saveRebalancingStocks(loggedToken, accountNumber, recordId, stocks);
      if (!stocksResult.success) {
        if (axios.isAxiosError(stocksResult.error)) {
          if (stocksResult.error.response?.status === 401) {
            throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
          }
        }
        throw new Error('종목 정보 저장에 실패했습니다.');
      }

      console.log('종목 정보 저장 응답:', stocksResult.data);

      if (stocksResult.data.message?.includes('성공')) {
        Alert.alert('완료', '포트폴리오가 성공적으로 저장되었습니다.');
        
        if (propOnSave) {
          propOnSave(portfolio);
        }
        
        handleClose();
      } else {
        throw new Error('종목 정보 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('포트폴리오 저장 에러:', error);
      let errorMessage = '포트폴리오 저장 중 오류가 발생했습니다.';
      
      if (axios.isAxiosError(error)) {
        console.error('API 에러 응답:', error.response?.data);
        if (error.response?.status === 401) {
          errorMessage = '인증이 만료되었습니다. 다시 로그인해주세요.';
        } else {
          errorMessage += '\n' + (error.response?.data?.message || error.message);
        }
      } else if (error instanceof Error) {
        errorMessage += '\n' + error.message;
      }
      
      Alert.alert('저장 오류', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 닫기 핸들러 - props.onClose 또는 navigation.goBack 사용
  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      setIsVisible(false);
      navigation.goBack();
    }
  };

  // 계좌 잔고 조회 함수 수정
  const getAccountBalance = async (account: AccountInfo, connectedId: string, password: string) => {
    try {
      const firmInfo = findSecuritiesFirmByName(account.company);
      if (!firmInfo) {
        throw new Error(`증권사 ${account.company}에 대한 코드를 찾을 수 없습니다.`);
      }

      const response = await axios.post(`${FLASK_SERVER_URL}/stock/balance`, {
        connectedId,
        organization: firmInfo.code,
        account: account.accountNumber,
        account_password: password
      });

      if (response.data.result.code === 'CF-00000') {
        const apiData = response.data.data;
        console.log('API 응답 데이터:', apiData);

        let stocks: any[] = [];
        let cashBalance = {
          krw: 0,
          usd: 0
        };
        
        // NH투자증권 형식 (resItemList)
        if (apiData.resItemList) {
          // 현금 잔고 처리
          cashBalance.krw = parseFloat(apiData.resCashBalance || apiData.resDepositReceived || '0');
          cashBalance.usd = parseFloat(apiData.resOverseasCashBalance || '0');

          stocks = apiData.resItemList.map((item: any) => {
            const isForeign = 
              item.resAccountCurrency === 'USD' || 
              item.resNation === 'USA' || 
              item.resNation === 'US' || 
              (item.resMarket && ['NASDAQ', 'NYSE', 'AMEX'].includes(item.resMarket));
            
            const currency = item.resAccountCurrency === 'USD' ? 'USD' : 'KRW';
            
            return {
              name: item.resItemName || '알 수 없음',
              amount: parseFloat(item.resQuantity || '0'),
              balance: parseFloat(item.resValuationAmt || item.resEvaluation || '0'),
              isForeign,
              currency,
              region: isForeign ? 2 : 1
            };
          });
        }
        // 삼성증권 등 다른 형식 (resAccountStock)
        else if (apiData.resAccountStock && Array.isArray(apiData.resAccountStock)) {
          // 현금 잔고 처리
          cashBalance.krw = parseFloat(apiData.resBalance || apiData.resAccountBalance || '0');
          cashBalance.usd = parseFloat(apiData.resUsdBalance || '0');

          stocks = apiData.resAccountStock.map((item: any) => {
            const isForeign = 
              item.marketCode === 'NYSE' || 
              item.marketCode === 'NASDAQ' || 
              item.nation === 'USA' || 
              item.nation === 'US';
            
            const currency = isForeign ? 'USD' : 'KRW';
            
            return {
              name: item.name || item.stockName || '알 수 없음',
              amount: parseFloat(item.quantity || '0'),
              balance: parseFloat(item.evaluation || item.amount || '0'),
              isForeign,
              currency,
              region: isForeign ? 2 : 1
            };
          });
        }

        return {
          cashBalance,
          stocks
        };
      } else {
        throw new Error(response.data.result.message || '잔고 조회 실패');
      }
    } catch (error) {
      console.error('계좌 잔고 조회 중 에러:', error);
      throw error;
    }
  };

  // 초기화 시 보유종목 가져오기 수정
  useEffect(() => {
    const fetchPortfolioData = async () => {
      // 계좌 정보는 항상 로드 (저장 시 필요하므로)
      let accounts: any[] = [];
      let stockAccountsData: any[] = [];
      
      try {
        accounts = await fetchConnectedAccounts();
        setConnectedAccounts(accounts);

        if (loggedToken) {
          const response = await fetchStockAccounts(loggedToken);
          stockAccountsData = response.success ? response.data : [];
          console.log('[포트폴리오 에디터] 계좌 정보 로드:', stockAccountsData);
          setStockAccounts(stockAccountsData);
        }
      } catch (error) {
        console.error('[포트폴리오 에디터] 계좌 정보 로드 실패:', error);
      }
      
      // 기존 포트폴리오 수정인 경우 계좌 정보만 로드하고 포트폴리오 데이터는 건드리지 않음
      if (propPortfolioToEdit || portfolioId) {
        return;
      }

      // 새 포트폴리오 생성 시에만 계좌 잔고 기반 초기화
      try {
        if (stockAccountsData.length > 0) {
          const firstAccount = stockAccountsData[0];
          const connectedId = typeof accounts[0] === 'string' ? accounts[0] : accounts[0]?.connectedId;
          
          if (!connectedId) {
            throw new Error('유효한 connectedId를 찾을 수 없습니다.');
          }

          const organizationCode = getOrganizationCode(firstAccount.company);
          const savedAccount = savedAccounts.find(acc => 
            acc.account === firstAccount.accountNumber && 
            acc.organization === organizationCode
          );

          if (savedAccount?.account_password) {
            try {
              const balance = await getAccountBalance(firstAccount, connectedId, savedAccount.account_password);
              console.log('잔고 조회 결과:', balance);

              const portfolioAssets: ExtendedPortfolioItem[] = [
                { 
                  name: '원화', 
                  region: 0 as const, 
                  target_percent: 30,
                  current_amount: balance.cashBalance.krw,
                  currency: 'KRW'
                },
                { 
                  name: '달러', 
                  region: 0 as const, 
                  target_percent: 20,
                  current_amount: balance.cashBalance.usd,
                  currency: 'USD'
                },
                ...balance.stocks.map((stock: any): ExtendedPortfolioItem => ({
                  name: stock.name,
                  ticker: stock.isForeign ? stock.name : undefined,
                  region: stock.isForeign ? (2 as const) : (1 as const),
                  target_percent: 0,
                  current_qty: stock.amount,
                  current_amount: stock.balance,
                  currency: stock.currency
                }))
              ];

              setPortfolio({
                portfolio_name: '',
                assets: portfolioAssets,
                description: ''
              });
            } catch (error) {
              console.error('계좌 잔고 조회 실패:', error);
              setDefaultPortfolio();
            }
          } else {
            setDefaultPortfolio();
          }
        } else {
          setDefaultPortfolio();
        }
      } catch (error) {
        console.error('초기 데이터 로딩 실패:', error);
        setDefaultPortfolio();
      }
    };

    fetchPortfolioData();
  }, [propPortfolioToEdit, portfolioId, savedAccounts]);

  // 기본 포트폴리오 설정 함수
  const setDefaultPortfolio = () => {
    setPortfolio({
      portfolio_name: '',
      assets: [
        { name: '원화', region: 0, target_percent: 50 },
        { name: '달러', region: 0, target_percent: 50 }
      ],
      description: ''
    });
  };

  // 포트폴리오 항목을 카테고리별로 그룹화하는 함수 추가
  const groupedAssets = useMemo(() => {
    const groups = {
      cash: portfolio.assets.filter(item => item.region === 0),
      domestic: portfolio.assets.filter(item => item.region === 1),
      foreign: portfolio.assets.filter(item => item.region === 2)
    };
    return groups;
  }, [portfolio.assets]);

  // 금액 포맷 함수
  const formatBalance = (balance: number | undefined, currency: string | undefined) => {
    if (balance === undefined) return '';
    
    return currency === 'USD' 
      ? `$${balance.toLocaleString()}`
      : `${balance.toLocaleString()}원`;
  };

  // AI 리밸런싱 추천 함수 추가
  const handleAIRecommendation = async () => {
    if (!loggedToken) {
      Alert.alert('인증 오류', '로그인이 필요합니다.');
      return;
    }

    if (portfolio.assets.length === 0) {
      Alert.alert('데이터 부족', '추천을 받기 위해서는 최소 1개 이상의 자산이 필요합니다.');
      return;
    }

    setIsRecommendationLoading(true);
    try {
      // 현재 포트폴리오 정보를 AI 모델에 전송할 형태로 변환
      const portfolioData = {
        assets: portfolio.assets.map(asset => ({
          name: asset.name,
          region: asset.region,
          current_amount: asset.current_amount || 0,
          current_percent: asset.target_percent,
          currency: asset.currency || 'KRW'
        })),
        total_balance: portfolio.assets.reduce((sum, asset) => {
          const amount = asset.current_amount || 0;
          return sum + (asset.currency === 'USD' ? amount * exchangeRate : amount);
        }, 0),
        user_risk_profile: 'moderate', // 기본값, 추후 사용자 설정으로 변경 가능
        market_conditions: 'normal' // 기본값, 추후 시장 상황 분석 결과로 변경 가능
      };

      console.log('AI 추천 요청 데이터:', portfolioData);

      // AI 리밸런싱 추천 API 호출
      const response = await axios.post(`${FLASK_SERVER_URL}/ai/rebalancing-recommendation`, portfolioData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loggedToken}`,
        }
      });

      if (response.data.success && response.data.recommendations) {
        const recommendations = response.data.recommendations;
        
        // 추천받은 비율을 포트폴리오에 적용
        const updatedAssets = portfolio.assets.map(asset => {
          const recommendation = recommendations.find((rec: any) => 
            rec.name === asset.name && rec.region === asset.region
          );
          
          return {
            ...asset,
            target_percent: recommendation ? Math.round(recommendation.recommended_percent * 100) / 100 : asset.target_percent
          };
        });

        setPortfolio({
          ...portfolio,
          assets: updatedAssets
        });

        // 추천 이유 표시 (선택사항)
        if (response.data.reasoning) {
          Alert.alert(
            'AI 추천 완료', 
            `추천 비율이 적용되었습니다.\n\n추천 이유: ${response.data.reasoning}`,
            [{ text: '확인' }]
          );
        } else {
          Alert.alert('AI 추천 완료', '추천 비율이 적용되었습니다.');
        }
      } else {
        throw new Error(response.data.message || 'AI 추천을 받을 수 없습니다.');
      }
    } catch (error) {
      console.error('AI 추천 요청 실패:', error);
      
      let errorMessage = 'AI 추천 요청 중 오류가 발생했습니다.';
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage = '인증이 만료되었습니다. 다시 로그인해주세요.';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      Alert.alert('AI 추천 실패', errorMessage);
    } finally {
      setIsRecommendationLoading(false);
    }
  };

  // Modal로 쓰일때는 isVisible=false면 null 반환
  if (!isVisible && propIsVisible !== undefined) return null;

  return (
    <Modal
      visible={propIsVisible !== undefined ? propIsVisible : isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {(propPortfolioToEdit || portfolioId) ? '포트폴리오 수정' : '새 포트폴리오 생성'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              console.log('Save button pressed');
              console.log('Loading:', loading);
              console.log('Portfolio name:', portfolio.portfolio_name);
              console.log('Valid percentage:', isValidPercentage);
              console.log('Total percentage:', totalPercentage);
              console.log('Assets:', portfolio.assets);
              
              handleSave();
            }}
            style={styles.saveButton}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>저장</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer}>
          {/* 포트폴리오 이름 입력 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>포트폴리오 이름 *</Text>
            <TextInput
              style={styles.input}
              value={portfolio.portfolio_name}
              onChangeText={text => setPortfolio({ ...portfolio, portfolio_name: text })}
              placeholder="포트폴리오 이름을 입력하세요"
              placeholderTextColor={theme.colors.text + '80'}
            />
          </View>

          {/* 설명 입력 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>설명 (선택)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={portfolio.description || ''}
              onChangeText={text => setPortfolio({ ...portfolio, description: text })}
              placeholder="포트폴리오에 대한 설명을 입력하세요"
              placeholderTextColor={theme.colors.text + '80'}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* 구성 항목 리스트 */}
          <View style={styles.assetsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>포트폴리오 구성 *</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={[styles.aiRecommendButton, isRecommendationLoading && styles.disabledButton]}
                  onPress={handleAIRecommendation}
                  disabled={isRecommendationLoading}
                >
                  {isRecommendationLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="bulb-outline" size={16} color="white" />
                      <Text style={styles.aiRecommendButtonText}>AI 추천</Text>
                    </>
                  )}
                </TouchableOpacity>
                <Text style={[
                  styles.percentageTotal,
                  { color: isValidPercentage ? theme.colors.primary : theme.colors.negative }
                ]}>
                  합계: {totalPercentage}%
                </Text>
              </View>
            </View>

            {/* 현금 자산 그룹 */}
            {groupedAssets.cash.length > 0 && (
              <>
                <Text style={styles.categoryLabel}>현금</Text>
                {groupedAssets.cash.map((item: ExtendedPortfolioItem, index) => (
                  <View key={`cash-${index}`} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemAmount}>
                        {formatBalance(item.current_amount, item.currency)}
                      </Text>
                    </View>
                    <View style={styles.itemActions}>
                      <TextInput
                        style={styles.percentInput}
                        value={item.target_percent.toString()}
                        onChangeText={value => handlePercentChange(portfolio.assets.findIndex(a => a === item), value)}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={theme.colors.text + '80'}
                      />
                      <Text style={styles.percentSymbol}>%</Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveItem(portfolio.assets.findIndex(a => a === item))}
                      >
                        <Ionicons name="trash-outline" size={20} color={theme.colors.negative} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* 국내주식 그룹 */}
            {groupedAssets.domestic.length > 0 && (
              <>
                <Text style={[styles.categoryLabel, styles.categorySpacing]}>국내주식</Text>
                {groupedAssets.domestic.map((item: ExtendedPortfolioItem, index) => (
                  <View key={`domestic-${index}`} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemAmount}>
                        {item.current_qty?.toLocaleString()}주 ({formatBalance(item.current_amount, item.currency)})
                      </Text>
                    </View>
                    <View style={styles.itemActions}>
                      <TextInput
                        style={styles.percentInput}
                        value={item.target_percent.toString()}
                        onChangeText={value => handlePercentChange(portfolio.assets.findIndex(a => a === item), value)}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={theme.colors.text + '80'}
                      />
                      <Text style={styles.percentSymbol}>%</Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveItem(portfolio.assets.findIndex(a => a === item))}
                      >
                        <Ionicons name="trash-outline" size={20} color={theme.colors.negative} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* 해외주식 그룹 */}
            {groupedAssets.foreign.length > 0 && (
              <>
                <Text style={[styles.categoryLabel, styles.categorySpacing]}>해외주식</Text>
                {groupedAssets.foreign.map((item: ExtendedPortfolioItem, index) => (
                  <View key={`foreign-${index}`} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemAmount}>
                        {item.current_qty?.toLocaleString()}주 ({formatBalance(item.current_amount, item.currency)})
                      </Text>
                    </View>
                    <View style={styles.itemActions}>
                      <TextInput
                        style={styles.percentInput}
                        value={item.target_percent.toString()}
                        onChangeText={value => handlePercentChange(portfolio.assets.findIndex(a => a === item), value)}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={theme.colors.text + '80'}
                      />
                      <Text style={styles.percentSymbol}>%</Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveItem(portfolio.assets.findIndex(a => a === item))}
                      >
                        <Ionicons name="trash-outline" size={20} color={theme.colors.negative} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* 항목 추가 버튼 */}
            <TouchableOpacity
              style={[styles.addButton, styles.categorySpacing]}
              onPress={handleAddItem}
            >
              <Text style={styles.addButtonText}>
                + 항목 추가
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* SearchModal 컴포넌트 사용 */}
        <SearchModal
          visible={searchModalVisible}
          onClose={() => setSearchModalVisible(false)}
          onSelect={handleSelectSearchItem}
        />
      </View>
    </Modal>
  );
};

export default withTheme(PortfolioEditor); 