import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { AuthProvider } from './context/AuthContext';
import RootNavigator from './navigation/RootNavigator';
import { colors } from './constants/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    NanumSquareRoundR: require('../assets/fonts/NanumSquareRoundR.ttf'),
    NanumSquareRoundB: require('../assets/fonts/NanumSquareRoundB.ttf'),
  });

  // 웹에서는 폰트 로딩을 기다리지 않고 바로 렌더링한다 (시스템 폰트로 먼저 보이다가
  // 폰트 파일 다운로드가 끝나면 자동으로 교체됨). 네이티브는 폰트가 없으면 레이아웃이
  // 크게 튀므로 기존대로 로딩을 기다린다.
  if (!fontsLoaded && Platform.OS !== 'web') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.navy} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
