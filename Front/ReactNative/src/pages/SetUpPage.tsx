// 경로: src/pages/SetUpPage.tsx
// 흐름도: App.js > AppNavigator.tsx > MainPage.tsx > SetUpPage.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 컴포넌트 임포트
import SetUoItemComponent from '../components/setUoItemComponent';

// 스타일 임포트
import createStyles from '../styles/pages/setUpPage.styles';
import withTheme from '../hoc/withTheme';
import { Theme } from '../types/theme';

// 설정 메뉴 항목 타입 정의
interface MenuItem {
  id: string;
  name: string;
  navigationTarget?: string;
}

// 섹션 타입 정의
interface MenuSection {
  title?: string;
  items: MenuItem[];
}

// 컴포넌트 props 인터페이스 정의
interface SetUpPageProps {
  theme: Theme;
}

const SetUpPage: React.FC<SetUpPageProps> = ({ theme }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  
  // 섹션별 메뉴 데이터 정의
  const menuSections: MenuSection[] = [
    {
      items: [
        { id: 'profile', name: '프로필 관리', navigationTarget: 'Profile' },
        { id: 'notification', name: '알림 설정', navigationTarget: 'Notification' },
        { id: 'theme', name: '테마', navigationTarget: 'Theme' },
      ]
    },
    {
      items: [
        { id: 'privacy', name: '개인정보 처리방침', navigationTarget: 'Privacy' },
        { id: 'terms', name: '이용약관', navigationTarget: 'Terms' },
      ]
    },
    {
      items: [
        { id: 'logout', name: '로그아웃' },
      ]
    }
  ];

  // 메뉴 항목 클릭 핸들러
  const handleItemPress = (item: MenuItem) => {
    if (item.id === 'logout') {
      // 로그아웃 처리 로직
      console.log('로그아웃');
    } else if (item.navigationTarget) {
      // 해당 화면으로 이동
      navigation.navigate(item.navigationTarget as never);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Ionicons 
          name="arrow-back" 
          size={24} 
          color={theme.colors.text} 
          onPress={() => navigation.goBack()} 
        />
        <Text style={styles.headerTitle}>설정</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView>
        {menuSections.map((section, sectionIndex) => (
          <View key={`section-${sectionIndex}`} style={styles.section}>
            {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
            
            {section.items.map((item) => (
              <SetUoItemComponent
                key={item.id}
                itemName={item.name}
                onPress={() => handleItemPress(item)}
                theme={theme}
              />
            ))}
            
            {sectionIndex < menuSections.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default withTheme(SetUpPage);
