import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

const ThemeToggle = () => {
  const { setTheme, themeType, colors } = useTheme();

  const toggleTheme = () => {
    if (themeType === 'light') {
      setTheme('dark');
    } else if (themeType === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.label, { color: colors.text }]}>
        테마: {themeType === 'system' ? '시스템' : themeType === 'light' ? '라이트' : '다크'}
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={toggleTheme}
      >
        <Text style={styles.buttonText}>테마 변경</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default ThemeToggle;
