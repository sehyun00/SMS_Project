import React, { useState, useEffect, useRef } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList, PortfolioEditorNavigationProp } from '../types/navigation';

// API 함수 임포트
import { 
  Portfolio, 
  PortfolioItem,
  createPortfolio,
  updatePortfolio,
  searchStocks
} from '../api/rebalancingApi';

// 더미 데이터 임포트
import {
  getRecordRuds,
  dummyRecords,
  getCurrentExchangeRate,
  updateRecordName,
  updateRecordRuds
} from '../data/dummyData';

// 스타일 임포트
import withTheme from '../hoc/withTheme';
import { Theme } from '../types/theme';
import createStyles from '../styles/components/portfolioEditor.styles';

// 검색 결과 항목 인터페이스
interface SearchResultItem {
  name: string;
  ticker?: string;
  region: number;
  price?: number;
}

// 컴포넌트 props 인터페이스 정의
interface PortfolioEditorProps {
  theme: Theme;
  isVisible?: boolean;
  onClose?: () => void;
  portfolioToEdit?: Portfolio; // 수정할 포트폴리오 (없으면 새로 생성)
  onSave?: (portfolio: Portfolio) => void;
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
  
  // route.params에서 portfolioId 가져오기
  const portfolioId = route.params?.portfolioId;
  
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
      
      // route.params에서 ID만 전달된 경우
      if (portfolioId) {
        try {
          // dummyData에서 해당 portfolioId(recordId)의 상세 데이터 가져오기
          const recordRuds = getRecordRuds(portfolioId);
          
          // 레코드 이름 찾기
          const recordInfo = dummyRecords.find(r => r.record_id === portfolioId);
          const recordName = recordInfo?.record_name || `포트폴리오 ${portfolioId}`;
          
          // 포트폴리오 객체 구성
          const portfolioAssets: PortfolioItem[] = recordRuds.map(rud => ({
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
  }, [propPortfolioToEdit, portfolioId, propIsVisible]);

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
    if (!searchQuery.trim() || !loggedToken) return;
    
    setSearchLoading(true);
    try {
      const result = await searchStocks(loggedToken, searchQuery, selectedRegion);
      if (result.success && result.data) {
        setSearchResults(result.data);
      } else {
        // 테스트용 더미 데이터 (실제로는 API 연결 필요)
        const dummyResults: SearchResultItem[] = [
          { name: '삼성전자', ticker: '005930.KS', region: 1, price: 72500 },
          { name: 'SK하이닉스', ticker: '000660.KS', region: 1, price: 167500 },
          { name: 'Apple Inc.', ticker: 'AAPL', region: 2, price: 186.48 },
          { name: 'Microsoft Corp.', ticker: 'MSFT', region: 2, price: 416.13 }
        ];
        
        // 현금 항목 (region이 0인 경우)
        if (selectedRegion === 0) {
          setSearchResults([
            { name: '원화', ticker: 'KRW', region: 0 },
            { name: '달러', ticker: 'USD', region: 0 }
          ]);
        } else {
          setSearchResults(dummyResults.filter(item => item.region === selectedRegion));
        }
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
    const newItem: PortfolioItem = {
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
    if (!portfolio.portfolio_name.trim()) {
      Alert.alert('입력 오류', '포트폴리오 이름을 입력해주세요.');
      return;
    }
    
    if (!isValidPercentage) {
      Alert.alert('비율 오류', '모든 항목의 비율 합계가 100%가 되어야 합니다.');
      return;
    }
    
    if (portfolio.assets.length < 2) {
      Alert.alert('항목 오류', '최소 2개 이상의 항목이 필요합니다.');
      return;
    }
    
    setLoading(true);
    try {
      // 실제 API 연결 전 더미 데이터 업데이트 (개발 중 테스트용)
      if (portfolio.portfolio_id || portfolioId) {
        const recordId = portfolio.portfolio_id || portfolioId!;
        
        // 1. 레코드 이름 업데이트
        updateRecordName(recordId, portfolio.portfolio_name);
        
        // 2. 레코드 상세 항목(RUDs) 업데이트
        const success = updateRecordRuds(recordId, portfolio.assets);
        
        if (!success) {
          throw new Error('포트폴리오 상세 정보 업데이트 실패');
        }
        
        console.log('포트폴리오 업데이트 성공:', recordId);
      }
      
      // 실제 API 호출 (서버 연결 후 활성화)
      /*
      if (portfolio.portfolio_id || portfolioId) {
        // 수정
        await updatePortfolio(loggedToken!, portfolio.portfolio_id || portfolioId!, portfolio);
      } else {
        // 새로 생성
        await createPortfolio(loggedToken!, portfolio);
      }
      */
      
      // 성공 알림
      Alert.alert('완료', '포트폴리오가 성공적으로 저장되었습니다.');
      
      // props.onSave가 있으면 호출, 없으면 네비게이션으로 돌아가기
      if (propOnSave) {
        propOnSave(portfolio);
      }
      
      handleClose();
    } catch (error) {
      console.error('포트폴리오 저장 에러:', error);
      Alert.alert('저장 오류', '포트폴리오 저장 중 오류가 발생했습니다.');
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
            onPress={handleSave}
            style={styles.saveButton}
            disabled={loading || !isValidPercentage}
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
              <Text style={[
                styles.percentageTotal,
                { color: isValidPercentage ? theme.colors.primary : theme.colors.negative }
              ]}>
                합계: {totalPercentage}%
              </Text>
            </View>

            {portfolio.assets.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemRegion}>
                    {item.region === 0 ? '현금' : item.region === 1 ? '국내주식' : '해외주식'}
                  </Text>
                </View>
                <View style={styles.itemActions}>
                  <TextInput
                    style={styles.percentInput}
                    value={item.target_percent.toString()}
                    onChangeText={value => handlePercentChange(index, value)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.colors.text + '80'}
                  />
                  <Text style={styles.percentSymbol}>%</Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(index)}
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.colors.negative} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* 항목 추가 버튼 */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddItem}
            >
              <Text style={styles.addButtonText}>
                + 항목 추가
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* 검색 모달 */}
        <Modal
          visible={searchModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSearchModalVisible(false)}
        >
          <View style={styles.searchModalContainer}>
            <View style={styles.searchModal}>
              <View style={styles.searchHeader}>
                <TouchableOpacity
                  onPress={() => setSearchModalVisible(false)}
                  style={styles.closeSearchButton}
                >
                  <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.searchTitle}>
                  항목 검색
                </Text>
              </View>

              {/* 지역 선택 탭 */}
              <View style={styles.regionTabs}>
                <TouchableOpacity
                  style={[
                    styles.regionTab,
                    selectedRegion === 0 && {
                      backgroundColor: theme.colors.primary + '20'
                    }
                  ]}
                  onPress={() => setSelectedRegion(0)}
                >
                  <Text style={[
                    styles.regionTabText,
                    { color: selectedRegion === 0 ? theme.colors.primary : theme.colors.text }
                  ]}>
                    현금
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.regionTab,
                    selectedRegion === 1 && {
                      backgroundColor: theme.colors.primary + '20'
                    }
                  ]}
                  onPress={() => setSelectedRegion(1)}
                >
                  <Text style={[
                    styles.regionTabText,
                    { color: selectedRegion === 1 ? theme.colors.primary : theme.colors.text }
                  ]}>
                    국내주식
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.regionTab,
                    selectedRegion === 2 && {
                      backgroundColor: theme.colors.primary + '20'
                    }
                  ]}
                  onPress={() => setSelectedRegion(2)}
                >
                  <Text style={[
                    styles.regionTabText,
                    { color: selectedRegion === 2 ? theme.colors.primary : theme.colors.text }
                  ]}>
                    해외주식
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 검색 입력 필드 */}
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={
                    selectedRegion === 0
                      ? "현금 종류 검색..."
                      : selectedRegion === 1
                      ? "국내주식 검색..."
                      : "해외주식 검색..."
                  }
                  placeholderTextColor={theme.colors.text + '80'}
                  onSubmitEditing={handleSearch}
                />
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={handleSearch}
                >
                  <Ionicons name="search" size={20} color="white" />
                </TouchableOpacity>
              </View>

              {/* 검색 결과 */}
              {searchLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              ) : (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item, index) => `${item.name}-${index}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.searchResultItem}
                      onPress={() => handleSelectSearchItem(item)}
                    >
                      <View>
                        <Text style={styles.resultItemName}>
                          {item.name}
                        </Text>
                        {item.ticker && (
                          <Text style={styles.resultItemTicker}>
                            {item.ticker}
                          </Text>
                        )}
                      </View>
                      {item.price && (
                        <Text style={styles.resultItemPrice}>
                          {item.region === 1 
                            ? `${item.price.toLocaleString()}원` 
                            : `$${item.price.toLocaleString()}`}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyResultContainer}>
                      <Text style={styles.emptyResultText}>
                        검색 결과가 없습니다
                      </Text>
                    </View>
                  }
                />
              )}
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

export default withTheme(PortfolioEditor); 