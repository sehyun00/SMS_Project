// 파일 경로: src/components/RebalancingComponent.tsx
// 컴포넌트 흐름: App.js > AppNavigator.js > MainPage.jsx > RebalancingComponent.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, FlatList, Alert, Dimensions, InteractionManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MainPageNavigationProp } from '../types/navigation';

// 컴포넌트 임포트
import RForeignComponent from './RForeignComponent';
import RDomesticComponent from './RDomesticComponent';
import RMoneyComponent from './RMoneyComponent';

// 더미 데이터 임포트 - 새로운 구조
import {
  dummyAccounts,
  dummyRecords,
  getAccountRecords,
  getRecordRuds,
  calculateRecordValue,
  getCurrentExchangeRate
} from '../data/dummyData';

// 스타일 임포트
import withTheme from '../hoc/withTheme';
import createStyles from '../styles/components/rebalancingComponent.styles';

// 커스텀 훅 임포트
import { useExchangeRate } from '../hooks/useExchangeRate';

// 공통 Theme 타입 가져오기
import { Theme } from '../types/theme';

// 계좌 정보 인터페이스
interface AccountInfo {
  name: string;
  number: string;
  principal: number;
  valuation: number;
  dailyProfit: number;
  dailyProfitPercent: number;
  totalProfit: number;
  totalProfitPercent: number;
}

// 현금 항목 데이터 인터페이스
interface CashItem {
  name: string;
  value: number;
  krwValue: number;
  targetPortion: number;
  rebalanceAmount: number;
}

// 주식 데이터 인터페이스
interface StockItem {
  name: string;
  ticker: string;
  value: number;
  krwValue: number;
  percentChange: number;
  targetPortion: number;
  rebalanceAmount: number;
  market_order?: number;
}

// 컴포넌트 props 인터페이스 정의
interface RebalancingComponentProps {
  theme: Theme;
  navigation?: MainPageNavigationProp;
}

const RebalancingComponent: React.FC<RebalancingComponentProps> = ({ theme, navigation }) => {
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const defaultNavigation = useNavigation<MainPageNavigationProp>();
  
  // navigation prop이 제공되지 않은 경우 useNavigation 훅 사용
  const nav = navigation || defaultNavigation;

  // 화면 너비 구하기
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth - 32; // 카드 너비 (양쪽 16px 패딩 제외)
  const cardTotalWidth = screenWidth; // 스와이프 시 한 번에 이동할 너비
  let cardMarginLeft = 0;

  // 스크롤뷰 참조
  const scrollViewRef = useRef<ScrollView>(null);
  // 현재 스와이프된 기록 인덱스 (페이지 인디케이터용)
  const [currentRecordIndex, setCurrentRecordIndex] = useState(0);
  
  // 현재 환율 정보 가져오기
  const { exchangeRate, loading: exchangeRateLoading } = useExchangeRate();
  const currentExchangeRate = exchangeRate || getCurrentExchangeRate();

  // 화폐 단위 상태 (기본값: 달러)
  const [currencyType, setCurrencyType] = useState<'dollar' | 'won'>('dollar');

  // 선택된 계좌 상태 (기본값: 첫 번째 계좌)
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);

  // 선택된 계좌의 리밸런싱 기록 목록
  const accountRecords = useMemo(() => {
    const account = dummyAccounts[selectedAccountIndex];
    return getAccountRecords(account.account);
  }, [selectedAccountIndex]);

  // 리밸런싱 기록 토글(드롭다운) 상태
  const [recordDropdownVisible, setRecordDropdownVisible] = useState(false);

  // 선택된 리밸런싱 기록 ID (기본값: 가장 최근 기록)
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

  // 선택된 리밸런싱 기록 확정 (없으면 가장 최근 것으로)
  const currentRecordId = useMemo(() => {
    if (selectedRecordId !== null) {
      cardMarginLeft = 16;
      return selectedRecordId;
    }
    
    if (accountRecords.length === 0) return null;
    
    // 가장 최신 날짜 기록 선택
    const sortedRecords = [...accountRecords].sort(
      (a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
    );
    return sortedRecords[0].record_id;
  }, [selectedRecordId, accountRecords]);

  // 현재 선택된 기록 정보
  const currentRecord = useMemo(() => {
    if (!currentRecordId) return null;
    return accountRecords.find(r => r.record_id === currentRecordId) || null;
  }, [currentRecordId, accountRecords]);

  // 리밸런싱 기록명 리스트
  const recordNames = useMemo(() => {
    return accountRecords.map(r => ({
      record_id: r.record_id,
      record_name: r.record_name || `기록 ${r.record_id}`,
      record_date: r.record_date,
    }));
  }, [accountRecords, selectedAccountIndex]);

  // 선택된 리밸런싱 기록 상세 데이터 가져오기
  const recordRuds = useMemo(() => {
    if (currentRecordId === null) return [];
    return getRecordRuds(currentRecordId);
  }, [currentRecordId]);

  // 1. value만 먼저 계산 (rebalanceAmount 없이)
  const cashItemsBase = useMemo(() => {
    return recordRuds
      .filter(rud => rud.stock_region === 0)
      .map(rud => ({
        name: rud.stock_name,
        value: rud.dollar || (rud.won ? rud.won / currentExchangeRate : 0),
        krwValue: rud.won || (rud.dollar ? rud.dollar * currentExchangeRate : 0),
        targetPortion: rud.expert_per,
      }));
  }, [recordRuds, currentExchangeRate]);

  const foreignStocksBase = useMemo(() => {
    return recordRuds
      .filter(rud => rud.stock_region === 2)
      .map(rud => ({
        name: rud.stock_name,
        ticker: rud.nos ? `${rud.nos}주` : '',
        value: rud.dollar || 0,
        krwValue: (rud.dollar || 0) * currentExchangeRate,
        percentChange: rud.rate || 0,
        targetPortion: rud.expert_per,
        market_order: rud.market_order
      }));
  }, [recordRuds, currentExchangeRate]);

  const domesticStocksBase = useMemo(() => {
    return recordRuds
      .filter(rud => rud.stock_region === 1)
      .map(rud => ({
        name: rud.stock_name,
        ticker: rud.nos ? `${rud.nos}주` : '',
        value: (rud.won || 0) / currentExchangeRate,
        krwValue: rud.won || 0,
        percentChange: rud.rate || 0,
        targetPortion: rud.expert_per,
        market_order: rud.market_order
      }));
  }, [recordRuds, currentExchangeRate]);

  // 2. totalBalance 계산
  const totalBalance = useMemo(() => {
    return (
      cashItemsBase.reduce((sum, item) => sum + item.value, 0) +
      foreignStocksBase.reduce((sum, item) => sum + item.value, 0) +
      domesticStocksBase.reduce((sum, item) => sum + item.value, 0)
    );
  }, [cashItemsBase, foreignStocksBase, domesticStocksBase]);

  // 3. rebalanceAmount를 포함한 최종 리스트 생성
  const getCashItems = useMemo((): CashItem[] => {
    return cashItemsBase.map(item => ({
      ...item,
      rebalanceAmount: (totalBalance * (item.targetPortion / 100)) - item.value,
    }));
  }, [cashItemsBase, totalBalance]);

  const getForeignStocks = useMemo((): StockItem[] => {
    return foreignStocksBase.map(item => ({
      ...item,
      rebalanceAmount: (totalBalance * (item.targetPortion / 100)) - item.value,
    }));
  }, [foreignStocksBase, totalBalance]);

  const getDomesticStocks = useMemo((): StockItem[] => {
    return domesticStocksBase.map(item => ({
      ...item,
      rebalanceAmount: (totalBalance * (item.targetPortion / 100)) - item.value,
    }));
  }, [domesticStocksBase, totalBalance]);

  // 계좌 정보 (dummyAccounts에서 선택된 계좌 사용)
  const accountInfo: AccountInfo = useMemo(() => {
    const account = dummyAccounts[selectedAccountIndex];

    // 총 자산 가치 계산
    const totalValue = currentRecordId ? calculateRecordValue(currentRecordId) : 0;

    // 원금 대비 손익 계산
    const dollarPrincipal = account.principal / currentExchangeRate;
    const profit = totalValue - dollarPrincipal;
    const profitPercent = (profit / dollarPrincipal) * 100;

    // 일간 손익 계산 (전날 잔고 기준)
    const prePrincipalInDollars = account.pre_principal / currentExchangeRate;
    const dailyProfit = totalValue - prePrincipalInDollars;
    const dailyProfitPercent = (dailyProfit / prePrincipalInDollars) * 100;

    return {
      name: account.company,
      number: account.account.slice(-4), // 계좌번호 마지막 4자리
      principal: account.principal,
      valuation: totalValue,
      dailyProfit: dailyProfit,
      dailyProfitPercent: parseFloat(dailyProfitPercent.toFixed(1)),
      totalProfit: profit,
      totalProfitPercent: parseFloat(profitPercent.toFixed(1))
    };
  }, [selectedAccountIndex, currentRecordId, currentExchangeRate]);

  // 총 현금 금액
  const totalCash = useMemo(() => {
    return getCashItems.reduce((sum, item) => sum + item.value, 0);
  }, [getCashItems]);

  // 총 해외주식 금액
  const totalForeign = useMemo(() => {
    return getForeignStocks.reduce((sum, item) => sum + item.value, 0);
  }, [getForeignStocks]);

  // 총 국내주식 금액
  const totalDomestic = useMemo(() => {
    return getDomesticStocks.reduce((sum, item) => sum + item.value, 0);
  }, [getDomesticStocks]);

  // 현재 비중 동적 계산을 위한 함수
  const calculateCurrentPortion = (amount: number): number => {
    if (totalBalance === 0) return 0;
    return parseFloat(((amount / totalBalance) * 100).toFixed(1));
  };

  // 통화 전환 버튼 클릭 핸들러
  const handleCurrencyChange = (type: 'dollar' | 'won') => {
    setCurrencyType(type);
  };

  // 스타일 적용용 함수
  const getProfitStyle = (value: number) =>
    value >= 0 ? styles.profitPositive : styles.profitNegative;

  // 수익 표시 포맷 함수
  const formatProfit = (value: number, type: 'won' | 'dollar') => {
    const sign = value > 0 ? '+' : value < 0 ? '-' : '';
    if (type === 'won') {
      return `${sign}${Math.abs(Math.round(value * currentExchangeRate)).toLocaleString()}원`;
    }
    return `${sign}$${Math.abs(value).toFixed(2)}`;
  };

  // 스크롤 위치 조정을 위한 함수 (반복 사용 위해 추출)
  const adjustScrollPosition = () => {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ x: cardTotalWidth, animated: false });
      setCurrentRecordIndex(0);
    });
  };

  // 포커스, 블러 상태 관리
  const componentIsFocused = useRef(true);
  
  // 앱이 활성화되거나 화면이 다시 포커스 받을 때 스크롤 위치 조정
  useEffect(() => {
    // 포커스 핸들러
    const handleFocus = () => {
      componentIsFocused.current = true;
      
      // 포커스 받을 때 스크롤 위치 재조정
      setTimeout(() => {
        if (componentIsFocused.current) {
          adjustScrollPosition();
        }
      }, 100);
    };
    
    // 블러 핸들러
    const handleBlur = () => {
      componentIsFocused.current = false;
    };
    
    // 이벤트 리스너 추가 (실제 앱에서는 React Navigation의 이벤트 사용)
    // 임시 구현 - 이벤트가 있을 때만 사용
    /*
    navigation.addListener('focus', handleFocus);
    navigation.addListener('blur', handleBlur);
    
    return () => {
      navigation.removeListener('focus', handleFocus);
      navigation.removeListener('blur', handleBlur);
    };
    */
    
    // 초기 실행
    handleFocus();
  }, []);
  
  // 계좌 선택 핸들러
  const handleAccountChange = (index: number) => {
    setSelectedAccountIndex(index);
    setSelectedRecordId(null); // 계좌 변경 시 리밸런싱 기록 선택 초기화
    
    // 계좌 변경 후 스크롤 위치 조정
    setTimeout(adjustScrollPosition, 300);
  };

  // 리밸런싱 기록 선택 핸들러 (수정)
  const handleRecordSelect = (record_id: number) => {
    setSelectedRecordId(record_id);
    setRecordDropdownVisible(false);
    
    // 선택된 기록의 인덱스 찾기
    const index = recordNames.findIndex(item => item.record_id === record_id);
    if (index !== -1) {
      setCurrentRecordIndex(index);
      // 스크롤 뷰 위치 조정
      scrollViewRef.current?.scrollTo({ x: index * screenWidth, animated: true });
    }
  };

  // 컴포넌트 마운트 시 스크롤 위치 초기화
  useEffect(() => {
    // UI 렌더링 완료 후 스크롤 위치 설정
    InteractionManager.runAfterInteractions(() => {
      adjustScrollPosition();
      
      // 추가 보장을 위해 0.5초 후에 한번 더 실행
      const timer = setTimeout(adjustScrollPosition, 500);
      return () => clearTimeout(timer);
    });
  }, []);

  // 스와이프 종료 후 핸들러
  const handleScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    // 카드 너비와 마진을 고려한 페이지 계산
    const newIndex = Math.round(contentOffsetX / cardTotalWidth);
    
    // 왼쪽 끝(포트폴리오 추가 카드)인 경우
    if (newIndex === 0) {
      // 포트폴리오 추가 모달 표시
      setShowLoadPortfolioModal(true);
      // 스크롤 위치를 첫 번째 실제 기록으로 복원
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: cardTotalWidth, animated: true });
        setCurrentRecordIndex(0);
      }, 300);
      return;
    }
    
    // 오른쪽 끝(새 기록 추가 카드)인 경우
    if (newIndex === recordNames.length + 1) {
      // 새 기록 추가 모달 표시
      setShowNewRecordModal(true);
      // 스크롤 위치를 마지막 실제 기록으로 복원
      if (recordNames.length > 0) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ 
            x: recordNames.length * cardTotalWidth, 
            animated: true 
          });
          setCurrentRecordIndex(recordNames.length - 1);
        }, 300);
      }
      return;
    }
    
    // 실제 기록 인덱스 계산 (포트폴리오 카드 고려)
    const actualIndex = newIndex - 1;
    
    if (actualIndex !== currentRecordIndex && actualIndex >= 0 && actualIndex < recordNames.length) {
      setCurrentRecordIndex(actualIndex);
      // 기록 ID 업데이트
      const record_id = recordNames[actualIndex]?.record_id;
      if (record_id) {
        setSelectedRecordId(record_id);
      }
    }
  };

  // 리밸런싱 기록 수정 버튼 핸들러
  const handleEditRecord = () => {
    if (currentRecord) {
      nav.navigate('PortfolioEditor', { portfolioId: currentRecord.record_id });
    } else {
      Alert.alert('알림', '수정할 리밸런싱 기록이 없습니다.');
    }
  };

  // 새 기록 추가 핸들러
  const handleAddRecord = () => {
    nav.navigate('PortfolioEditor');
    setShowNewRecordModal(false);
  };

  // 포트폴리오 불러오기 핸들러
  const handleLoadPortfolio = () => {
    nav.navigate('PortfolioEditor');
    setShowLoadPortfolioModal(false);
  };

  // 종목 평균 변화율 계산
  const getForeignPercentChange = useMemo(() => {
    if (getForeignStocks.length === 0) return 0;
    const totalPercentChange = getForeignStocks.reduce((sum, stock) => sum + stock.percentChange, 0);
    return parseFloat((totalPercentChange / getForeignStocks.length).toFixed(1));
  }, [getForeignStocks]);

  const getDomesticPercentChange = useMemo(() => {
    if (getDomesticStocks.length === 0) return 0;
    const totalPercentChange = getDomesticStocks.reduce((sum, stock) => sum + stock.percentChange, 0);
    return parseFloat((totalPercentChange / getDomesticStocks.length).toFixed(1));
  }, [getDomesticStocks]);

  const { name, number, principal, valuation, dailyProfit, dailyProfitPercent, totalProfit, totalProfitPercent } = accountInfo;

  // 화면 회전 핸들러
  const handleRotateScreen = () => {
    // 화면 회전 기능 구현 (향후 구현)
    Alert.alert('알림', '화면 회전 기능은 준비 중입니다.');
  };

  const [showNewRecordModal, setShowNewRecordModal] = useState(false);
  const [showLoadPortfolioModal, setShowLoadPortfolioModal] = useState(false);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsHorizontalScrollIndicator={false}
    >
      {/* 계좌 선택 */}
      <View style={styles.accountSelectorContainer}>
        {dummyAccounts.map((account, index) => (
          <TouchableOpacity
            key={account.account}
            style={[
              styles.accountButton,
              selectedAccountIndex === index ? styles.selectedAccountButton : null
            ]}
            onPress={() => handleAccountChange(index)}
          >
            <Text style={selectedAccountIndex === index ? styles.selectedAccountText : styles.accountText}>
              {account.company} {account.account.slice(-4)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 리밸런싱 기록 스와이프 영역 */}
      <View style={styles.recordSwipeContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          snapToInterval={cardTotalWidth}
          decelerationRate="fast"
          snapToAlignment="center"
          contentContainerStyle={{ paddingLeft: 0, paddingRight: 0 }}
        >
          {/* 포트폴리오 추가 카드 (왼쪽 끝) */}
          <View style={[styles.loadPortfolioContainer, { width: cardWidth, marginLeft: cardMarginLeft, marginRight:  screenWidth - cardWidth - 16 }]}>
            <Text style={styles.loadPortfolioIcon}>+</Text>
            <Text style={styles.addRecordText}>새 포트폴리오 추가하기</Text>
          </View>
          
          {/* 기존 기록 카드 */}
          {recordNames.map((record, index) => (
            <View key={record.record_id} style={[styles.recordItemContainer, { width: cardWidth, marginLeft: 16, marginRight: screenWidth - cardWidth - 16 }]}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={[styles.recordToggleText, {fontSize: 18, fontWeight: '600'}]}>
                    {record.record_name || `기록 ${record.record_id}`}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.recordEditButton, {backgroundColor: 'transparent'}]}
                  onPress={handleEditRecord}
                >
                  <Text style={styles.recordEditText}>수정</Text>
                </TouchableOpacity>
              </View>
              
              {/* 계좌 정보 영역 - 수직 방향 정렬 */}
              <View style={{marginTop: 5}}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10}}>
                  <Text style={styles.infoLabel}>원금</Text>
                  <Text style={styles.infoValue}>
                    {currencyType === 'won'
                      ? `${principal.toLocaleString()}원`
                      : `$${(principal / currentExchangeRate).toFixed(2)}`}
                  </Text>
                </View>
                
                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10}}>
                  <Text style={styles.infoLabel}>실시간 잔고</Text>
                  <Text style={styles.infoValue}>
                    {currencyType === 'won'
                      ? `${Math.round(valuation * currentExchangeRate).toLocaleString()}원`
                      : `$${valuation.toFixed(2)}`}
                  </Text>
                </View>
                
                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10}}>
                  <Text style={styles.infoLabel}>총 수익</Text>
                  <Text style={[getProfitStyle(totalProfit)]}>
                    {formatProfit(totalProfit, currencyType)}({totalProfitPercent.toFixed(1)}%)
                  </Text>
                </View>
                
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                  <Text style={styles.infoLabel}>일간 수익</Text>
                  <Text style={[getProfitStyle(dailyProfit)]}>
                    {formatProfit(dailyProfit, currencyType)}({dailyProfitPercent.toFixed(1)}%)
                  </Text>
                </View>
              </View>
            </View>
          ))}
          
          {/* 새 기록 추가 카드 (오른쪽 끝) */}
          <View style={[styles.addRecordContainer, { width: cardWidth, marginLeft: 16, marginRight: screenWidth - cardWidth - 16 }]}>
            <Text style={styles.addRecordIcon}>+</Text>
            <Text style={styles.addRecordText}>새 리밸런싱 기록 추가</Text>
          </View>
        </ScrollView>
        
        {/* 페이지 인디케이터 */}
        <View style={styles.recordPaginationContainer}>
          {/* 포트폴리오 추가 인디케이터 */}
          <View
            style={[
              styles.paginationDot,
              currentRecordIndex === -1 ? styles.activePaginationDot : null
            ]}
          />
          
          {/* 기존 기록 인디케이터 */}
          {recordNames.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentRecordIndex ? styles.activePaginationDot : null
              ]}
            />
          ))}
          
          {/* 새 기록 추가 인디케이터 */}
          <View
            style={[
              styles.paginationDot,
              currentRecordIndex === recordNames.length ? styles.activePaginationDot : null
            ]}
          />
        </View>
      </View>

      {/* 통화 전환 버튼 - 현금 영역 위에 배치 */}
      <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10, marginTop: 2, marginRight: 2}}>
        {/* 화면 회전 버튼 */}
        <TouchableOpacity 
          style={styles.rotateButton}
          onPress={handleRotateScreen}
        >
          <Text style={styles.rotateButtonText}>↻</Text>
        </TouchableOpacity>
        
        <View style={styles.currencyToggleContainer}>
          <TouchableOpacity
            style={[
              styles.currencyButton,
              currencyType === 'dollar' ? styles.activeCurrency : null
            ]}
            onPress={() => setCurrencyType('dollar')}
          >
            <Text style={[
              styles.currencyText,
              currencyType === 'dollar' ? styles.activeCurrencyText : null
            ]}>$</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.currencyButton,
              currencyType === 'won' ? styles.activeCurrency : null
            ]}
            onPress={() => setCurrencyType('won')}
          >
            <Text style={[
              styles.currencyText,
              currencyType === 'won' ? styles.activeCurrencyText : null
            ]}>원</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 현금 카드 */}
      <RMoneyComponent
        totalAmount={totalCash}
        cashItems={getCashItems}
        currencyType={currencyType}
        exchangeRate={currentExchangeRate}
        totalBalance={totalBalance}
        calculateCurrentPortion={calculateCurrentPortion}
      />

      {/* 해외주식 카드 */}
      <RForeignComponent
        totalAmount={totalForeign}
        percentChange={getForeignPercentChange}
        stocks={getForeignStocks}
        currencyType={currencyType}
        exchangeRate={currentExchangeRate}
        totalBalance={totalBalance}
        calculateCurrentPortion={calculateCurrentPortion}
      />

      {/* 국내주식 카드 */}
      <RDomesticComponent
        totalAmount={totalDomestic}
        percentChange={getDomesticPercentChange}
        stocks={getDomesticStocks}
        currencyType={currencyType}
        exchangeRate={currentExchangeRate}
        totalBalance={totalBalance}
        calculateCurrentPortion={calculateCurrentPortion}
      />

      {/* 새 기록 추가 모달 */}
      <Modal
        visible={showNewRecordModal}
        transparent
        animationType="fade"
      >
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPressOut={() => setShowNewRecordModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 16}}>
              새 리밸런싱 기록 추가
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.primary,
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 16
              }}
              onPress={handleAddRecord}
            >
              <Text style={{color: '#FFF', fontWeight: 'bold'}}>추가하기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* 포트폴리오 추가 모달 */}
      <Modal
        visible={showLoadPortfolioModal}
        transparent
        animationType="fade"
      >
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPressOut={() => setShowLoadPortfolioModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 16}}>
              새 포트폴리오 추가하기
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.primary,
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 16
              }}
              onPress={handleLoadPortfolio}
            >
              <Text style={{color: '#FFF', fontWeight: 'bold'}}>추가하기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

export default withTheme(RebalancingComponent);