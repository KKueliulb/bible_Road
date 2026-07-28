import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/theme';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

export default function RootNavigator() {
  const { isLoading, userId, user } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.navy} size="large" />
      </View>
    );
  }

  function renderContent() {
    if (!userId) return <AuthStack />;
    // 온보딩 도입 전에 가입한 기존 유저는 hasOnboarded 필드가 아예 없어(undefined) 이 분기를 건너뛴다.
    if (user && user.hasOnboarded === false) return <OnboardingScreen />;
    return <MainTabs />;
  }

  return <NavigationContainer>{renderContent()}</NavigationContainer>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
