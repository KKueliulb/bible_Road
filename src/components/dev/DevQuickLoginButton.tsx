import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors, fonts } from '../../constants/theme';

const TEST_NICKNAME = '테스트유저';

/**
 * 개발 중 반복적으로 회원가입 폼을 채우지 않고 바로 앱 내부(로드맵 등)를 확인하기 위한 버튼.
 * __DEV__는 production 빌드에서 false라 자동으로 숨겨진다.
 */
export default function DevQuickLoginButton() {
  const { login, signup } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!__DEV__) return null;

  async function handlePress() {
    setIsSubmitting(true);
    setError(null);
    try {
      const loginResult = await login(TEST_NICKNAME);
      if (!loginResult.ok) {
        const signupResult = await signup(TEST_NICKNAME, TEST_NICKNAME);
        if (!signupResult.ok) {
          setError(signupResult.error);
          return;
        }
        // 회원가입은 더 이상 자동 로그인하지 않으므로, 만든 계정으로 다시 로그인한다.
        const retryLoginResult = await login(TEST_NICKNAME);
        if (!retryLoginResult.ok) {
          setError(retryLoginResult.error);
        }
      }
    } catch {
      setError('테스트 로그인에 실패했어요.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.divider}>── 개발자 전용 ──</Text>
      <Pressable style={styles.button} onPress={handlePress} disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color={colors.textSecondary} />
        ) : (
          <Text style={styles.buttonText}>🧪 테스트 계정으로 바로 시작</Text>
        )}
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    alignItems: 'center',
  },
  divider: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  button: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.textSecondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.danger,
    marginTop: 6,
  },
});
