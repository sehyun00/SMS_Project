import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import styles from '../styles/components/homeComponent.styles';

function HomeComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>홈 화면</Text>
    </View>
  );
}

export default HomeComponent;
