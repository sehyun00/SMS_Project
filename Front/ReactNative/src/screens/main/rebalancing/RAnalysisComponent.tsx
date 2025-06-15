import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import withTheme from '../../../hoc/withTheme';
import createStyles from '../../../styles/components/rebalancingComponent.styles';
import { Theme } from '../../../types/theme';
import { PortfolioAnalysisResponse } from '../../../api/nlpApi';

interface RAnalysisComponentProps {
  theme: Theme;
  analysisResult?: PortfolioAnalysisResponse;
  isLoading: boolean;
  onAnalyze: () => void;
  error?: string;
}

const RAnalysisComponent: React.FC<RAnalysisComponentProps> = ({
  theme,
  analysisResult,
  isLoading,
  onAnalyze,
  error
}) => {
  const styles = createStyles(theme);

  // 등급에 따른 색상 결정
  const getGradeColor = (grade: string) => {
    const gradeValue = grade.charAt(0);
    switch (gradeValue) {
      case 'A': return '#4CAF50'; // 녹색
      case 'B': return '#FF9800'; // 주황색
      case 'C': return '#FFC107'; // 노란색
      case 'D': return '#F44336'; // 빨간색
      case 'F': return '#9C27B0'; // 보라색
      default: return theme.colors.text;
    }
  };

  // 우선순위 아이템 렌더링
  const renderPriorityItem = (item: string, index: number, isHighPriority: boolean) => (
    <View
      key={index}
      style={{
        backgroundColor: isHighPriority 
          ? `${theme.colors.error}15` 
          : '#FFC10715',
        borderLeftColor: isHighPriority 
          ? theme.colors.error 
          : '#FFC107',
        borderLeftWidth: 3,
        marginBottom: 8,
        padding: 12,
        borderRadius: 8
      }}
    >
      <Text style={{ color: theme.colors.text, lineHeight: 20 }}>
        {item}
      </Text>
    </View>
  );

  return (
    <View style={[styles.card, { marginTop: 16 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons 
            name="analytics-outline" 
            size={20} 
            color={theme.colors.primary} 
            style={{ marginRight: 8 }}
          />
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>포트폴리오 분석</Text>
        </View>
        
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
            opacity: isLoading ? 0.6 : 1
          }}
          onPress={onAnalyze}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.card} />
          ) : (
            <Text style={{ color: theme.colors.card, fontSize: 12, fontWeight: '600' }}>
              분석하기
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View>
        {error ? (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <Ionicons name="warning-outline" size={40} color={theme.colors.error} />
            <Text style={{ color: theme.colors.error, marginTop: 8, textAlign: 'center' }}>
              {error}
            </Text>
                         <TouchableOpacity
               style={{
                 backgroundColor: theme.colors.primary,
                 paddingHorizontal: 16,
                 paddingVertical: 8,
                 borderRadius: 6,
                 marginTop: 12
               }}
               onPress={onAnalyze}
             >
               <Text style={{ color: theme.colors.card, fontSize: 12 }}>다시 시도</Text>
             </TouchableOpacity>
           </View>
         ) : analysisResult ? (
           <View>
             {/* 점수 및 등급 */}
             <View style={{ 
               flexDirection: 'row', 
               justifyContent: 'space-between', 
               alignItems: 'center',
               backgroundColor: `${theme.colors.primary}10`,
               padding: 16,
               borderRadius: 8,
               marginBottom: 16
             }}>
               <View style={{ alignItems: 'center', flex: 1 }}>
                 <Text style={{ color: theme.colors.textLight, fontSize: 12 }}>
                   포트폴리오 등급
                 </Text>
                 <Text style={{
                   fontSize: 28,
                   fontWeight: 'bold',
                   color: getGradeColor(analysisResult.portfolio_score),
                   marginTop: 4
                 }}>
                   {analysisResult.portfolio_score}
                 </Text>
               </View>
               
               <View style={{ alignItems: 'center', flex: 1 }}>
                 <Text style={{ color: theme.colors.textLight, fontSize: 12 }}>
                   종합 점수
                 </Text>
                 <Text style={{
                   fontSize: 28,
                   fontWeight: 'bold',
                   color: theme.colors.primary,
                   marginTop: 4
                 }}>
                   {analysisResult.portfolio_rank}
                 </Text>
                 <Text style={{ color: theme.colors.textLight, fontSize: 10 }}>
                   / 100점
                 </Text>
               </View>
             </View>

             {/* 높은 우선순위 개선사항 */}
             {analysisResult.high_priority.length > 0 && (
               <View style={{ marginBottom: 16 }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                   <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
                   <Text style={{ 
                     color: theme.colors.error,
                     fontSize: 14,
                     fontWeight: '600',
                     marginLeft: 6
                   }}>
                     긴급 개선사항
                   </Text>
                 </View>
                 {analysisResult.high_priority.map((item, index) =>
                   renderPriorityItem(item, index, true)
                 )}
               </View>
             )}

             {/* 중간 우선순위 개선사항 */}
             {analysisResult.medium_priority.length > 0 && (
               <View>
                 <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                   <Ionicons name="information-circle" size={16} color="#FFC107" />
                   <Text style={{ 
                     color: '#FFC107',
                     fontSize: 14,
                     fontWeight: '600',
                     marginLeft: 6
                   }}>
                     권장 개선사항
                   </Text>
                 </View>
                {analysisResult.medium_priority.map((item, index) =>
                  renderPriorityItem(item, index, false)
                )}
              </View>
            )}

            {/* 개선사항이 없는 경우 */}
            {analysisResult.high_priority.length === 0 && analysisResult.medium_priority.length === 0 && (
                         <View style={{ alignItems: 'center', padding: 20 }}>
             <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
             <Text style={{ 
               color: '#4CAF50', 
               marginTop: 8, 
               fontSize: 16,
               fontWeight: '600'
             }}>
                  완벽한 포트폴리오입니다!
                </Text>
                <Text style={{ 
                  color: theme.colors.textLight, 
                  marginTop: 4,
                  textAlign: 'center' 
                }}>
                  현재 포트폴리오 구성이 매우 우수합니다.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <Ionicons name="analytics-outline" size={40} color={theme.colors.textLight} />
            <Text style={{ 
              color: theme.colors.textLight, 
              marginTop: 8,
              textAlign: 'center' 
            }}>
              포트폴리오 분석을 시작하려면{'\n'}"분석하기" 버튼을 눌러주세요
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default withTheme(RAnalysisComponent); 