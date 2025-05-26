// 파일 경로: src/screens/setup/SetUpPage.tsx
// 컴포넌트 흐름: App.js > AuthNavigator.tsx > SetUpPage.tsx

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 컴포넌트 임포트
import SetUpItemComponent from '../../components/common/ui/setUoItemComponent';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from './setupItem/ThemeToggle';
import TermsPage from './setupItem/TermsPage';
import PrivacyPage from './setupItem/PrivacyPage';
import NotificationPage from './setupItem/NotificationPage';
import ProfilePage from './setupItem/ProfilePage';

// 스타일 임포트
import createStyles from '../../styles/pages/setUpPage.styles';
import withTheme from '../../hoc/withTheme';
import { Theme } from '../../types/theme';

// 설정 스택 네비게이터 타입 정의
type SetUpStackParamList = {
  설정메인: undefined;
  프로필관리: undefined;
  알림설정: undefined;
  테마설정: undefined;
  이용약관: undefined;
  개인정보처리방침: undefined;
};

const SetUpStack = createNativeStackNavigator<SetUpStackParamList>();

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

// 메인 설정 화면 컴포넌트
const SetUpMain: React.FC<SetUpPageProps> = ({ theme }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const { logout } = useAuth();
  
  const menuSections: MenuSection[] = [
    {
      items: [
        { id: 'profile', name: '프로필 관리', navigationTarget: '프로필관리' },
        { id: 'notification', name: '알림 설정', navigationTarget: '알림설정' },
        { id: 'theme', name: '테마', navigationTarget: '테마설정' },
      ]
    },
    {
      items: [
        { id: 'privacy', name: '개인정보 처리방침', navigationTarget: '개인정보처리방침' },
        { id: 'terms', name: '이용약관', navigationTarget: '이용약관' },
      ]
    },
    {
      items: [
        { id: 'logout', name: '로그아웃' },
      ]
    }
  ];

  const handleItemPress = (item: MenuItem) => {
    if (item.id === 'logout') {
      logout();
    } else if (item.navigationTarget) {
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
          <View key={`section-${sectionIndex}`}>
            {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
            
            {section.items.map((item) => (
              <SetUpItemComponent
                key={item.id}
                itemName={item.name}
                onPress={() => handleItemPress(item)}
                theme={theme}
                textColor={item.id === 'logout' ? theme.colors.error : undefined}
              />
            ))}
            
            {sectionIndex < menuSections.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// 설정 페이지 메인 컴포넌트
const SetUpPage = () => {
  return (
    <SetUpStack.Navigator screenOptions={{ headerShown: false }}>
      <SetUpStack.Screen name="설정메인" component={withTheme(SetUpMain)} />
      <SetUpStack.Screen name="프로필관리" component={ProfilePage} />
      <SetUpStack.Screen name="알림설정" component={NotificationPage} />
      <SetUpStack.Screen name="테마설정" component={ThemeToggle} />
      <SetUpStack.Screen name="이용약관" component={TermsPage} />
      <SetUpStack.Screen name="개인정보처리방침" component={PrivacyPage} />
    </SetUpStack.Navigator>
  );
};

export default SetUpPage;
