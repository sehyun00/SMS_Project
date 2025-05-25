import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import withTheme from '../../../hoc/withTheme';
import { Theme } from '../../../types/theme';
import createStyles from '../../../styles/pages/setUpPage.styles';

interface ProfilePageProps {
  theme: Theme;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ theme }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Ionicons 
          name="arrow-back" 
          size={24} 
          color={theme.colors.text} 
          onPress={() => navigation.goBack()} 
        />
        <Text style={styles.headerTitle}>프로필 관리</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.paragraph}>프로필 관리 기능 준비 중입니다.</Text>
      </View>
    </View>
  );
};

export default withTheme(ProfilePage); 