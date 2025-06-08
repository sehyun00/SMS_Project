import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../types/theme';
import createStyles from '../../styles/components/searchModal.styles';
import { searchStocks } from '../../api/rebalancingApi';
import { useAuth } from '../../context/AuthContext';
import withTheme from '../../hoc/withTheme';

// 검색 결과 항목 인터페이스
interface SearchResultItem {
  name: string;
  ticker?: string;
  region: number;
  price?: number;
}

interface SearchModalProps {
  theme: Theme;
  visible: boolean;
  onClose: () => void;
  onSelect: (item: SearchResultItem) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({
  theme,
  visible,
  onClose,
  onSelect
}) => {
  const styles = createStyles(theme);
  const { loggedToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<number>(0);

  // 검색 함수
  const handleSearch = async () => {
    if (!searchQuery.trim() || !loggedToken) return;
    
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

      // API 호출
      const result = await searchStocks(loggedToken, searchQuery, selectedRegion);
      if (result.success && result.data) {
        setSearchResults(result.data);
      } else {
        console.error('검색 실패:', result.error);
        Alert.alert('검색 오류', '종목 검색 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('검색 에러:', error);
      Alert.alert('검색 오류', '종목 검색 중 오류가 발생했습니다.');
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>
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
                  onPress={() => onSelect(item)}
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
  );
};

export default withTheme(SearchModal); 