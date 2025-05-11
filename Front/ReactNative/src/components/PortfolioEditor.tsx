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
  ActivityIndicator,
  StyleSheet
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

// 스타일 임포트
import withTheme from '../hoc/withTheme';
import { Theme } from '../types/theme';

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
          // 실제 구현에서는 API 호출로 데이터 가져오기
          // 예시 코드 (나중에 실제 API로 교체)
          const dummyPortfolio: Portfolio = {
            portfolio_id: portfolioId,
            portfolio_name: `포트폴리오 ${portfolioId}`,
            assets: [
              { name: '원화', region: 0, target_percent: 30 },
              { name: '달러', region: 0, target_percent: 20 },
              { name: '삼성전자', ticker: '005930.KS', region: 1, target_percent: 25 },
              { name: 'Apple Inc.', ticker: 'AAPL', region: 2, target_percent: 25 }
            ],
            description: '샘플 포트폴리오 설명입니다.'
          };
          
          setPortfolio(dummyPortfolio);
        } catch (error) {
          console.error('포트폴리오 정보 로딩 에러:', error);
          Alert.alert('오류', '포트폴리오 정보를 불러올 수 없습니다.');
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
      region: item.region,
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
      // API 호출 로직
      if (portfolio.portfolio_id || portfolioId) {
        // 수정
        await updatePortfolio(loggedToken!, portfolio.portfolio_id || portfolioId!, portfolio);
      } else {
        // 새로 생성
        await createPortfolio(loggedToken!, portfolio);
      }
      
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
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {(propPortfolioToEdit || portfolioId) ? '포트폴리오 수정' : '새 포트폴리오 생성'}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.saveButton,
              { backgroundColor: theme.colors.primary }
            ]}
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
            <Text style={[styles.label, { color: theme.colors.text }]}>포트폴리오 이름 *</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text
                }
              ]}
              value={portfolio.portfolio_name}
              onChangeText={text => setPortfolio({ ...portfolio, portfolio_name: text })}
              placeholder="포트폴리오 이름을 입력하세요"
              placeholderTextColor={theme.colors.text + '80'}
            />
          </View>

          {/* 설명 입력 */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>설명 (선택)</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { 
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text
                }
              ]}
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
              <Text style={[styles.label, { color: theme.colors.text }]}>포트폴리오 구성 *</Text>
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
                  <Text style={[styles.itemName, { color: theme.colors.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.itemRegion, { color: theme.colors.text + '80' }]}>
                    {item.region === 0 ? '현금' : item.region === 1 ? '국내주식' : '해외주식'}
                  </Text>
                </View>
                <View style={styles.itemActions}>
                  <TextInput
                    style={[
                      styles.percentInput,
                      { 
                        borderColor: theme.colors.border,
                        backgroundColor: theme.colors.card,
                        color: theme.colors.text
                      }
                    ]}
                    value={item.target_percent.toString()}
                    onChangeText={value => handlePercentChange(index, value)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.colors.text + '80'}
                  />
                  <Text style={[styles.percentSymbol, { color: theme.colors.text }]}>%</Text>
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
              style={[styles.addButton, { borderColor: theme.colors.primary }]}
              onPress={handleAddItem}
            >
              <Text style={[styles.addButtonText, { color: theme.colors.primary }]}>
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
            <View style={[styles.searchModal, { backgroundColor: theme.colors.background }]}>
              <View style={styles.searchHeader}>
                <TouchableOpacity
                  onPress={() => setSearchModalVisible(false)}
                  style={styles.closeSearchButton}
                >
                  <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.searchTitle, { color: theme.colors.text }]}>
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
                  style={[
                    styles.searchInput,
                    { 
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.card,
                      color: theme.colors.text
                    }
                  ]}
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
                  style={[styles.searchButton, { backgroundColor: theme.colors.primary }]}
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
                      style={[styles.searchResultItem, { borderBottomColor: theme.colors.border }]}
                      onPress={() => handleSelectSearchItem(item)}
                    >
                      <View>
                        <Text style={[styles.resultItemName, { color: theme.colors.text }]}>
                          {item.name}
                        </Text>
                        {item.ticker && (
                          <Text style={[styles.resultItemTicker, { color: theme.colors.text + '80' }]}>
                            {item.ticker}
                          </Text>
                        )}
                      </View>
                      {item.price && (
                        <Text style={[styles.resultItemPrice, { color: theme.colors.text }]}>
                          {item.region === 1 
                            ? `${item.price.toLocaleString()}원` 
                            : `$${item.price.toLocaleString()}`}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyResultContainer}>
                      <Text style={[styles.emptyResultText, { color: theme.colors.text + '80' }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  assetsContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  percentageTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemRegion: {
    fontSize: 14,
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentInput: {
    width: 60,
    textAlign: 'right',
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginRight: 4,
  },
  percentSymbol: {
    marginRight: 12,
    fontSize: 16,
  },
  removeButton: {
    padding: 8,
  },
  addButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    fontSize: 16,
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  searchModal: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  closeSearchButton: {
    padding: 8,
  },
  regionTabs: {
    flexDirection: 'row',
    padding: 16,
  },
  regionTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  regionTabText: {
    fontWeight: '500',
  },
  searchInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    marginLeft: 8,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resultItemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  resultItemTicker: {
    fontSize: 14,
    marginTop: 4,
  },
  resultItemPrice: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyResultContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyResultText: {
    fontSize: 16,
  },
});

export default withTheme(PortfolioEditor); 