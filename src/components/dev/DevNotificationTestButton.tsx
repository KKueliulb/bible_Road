import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { sendTestNotificationIn } from '../../services/notificationsService';
import { colors, fonts } from '../../constants/theme';

const TEST_DELAY_SECONDS = 5;

/**
 * 실제 기기에서 로컬 알림이 정상적으로 뜨는지 바로 확인해보는 개발용 버튼. __DEV__는 production
 * 빌드에서 false라 자동으로 숨겨진다. 8시까지 기다리지 않고 5초 뒤 테스트 알림을 예약한다.
 */
export default function DevNotificationTestButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<'granted' | 'denied' | null>(null);

  if (!__DEV__) return null;

  async function handlePress() {
    setIsSubmitting(true);
    setResult(null);
    try {
      const granted = await sendTestNotificationIn(TEST_DELAY_SECONDS);
      setResult(granted ? 'granted' : 'denied');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={handlePress} disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color={colors.textSecondary} />
        ) : (
          <Text style={styles.text}>🔔 [개발용] {TEST_DELAY_SECONDS}초 뒤 테스트 알림 보내기</Text>
        )}
      </Pressable>
      {result === 'granted' && (
        <Text style={styles.resultText}>예약했어요. {TEST_DELAY_SECONDS}초 기다려보세요.</Text>
      )}
      {result === 'denied' && <Text style={styles.resultText}>알림 권한이 없어서 예약 못 했어요.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  button: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.textSecondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  resultText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
