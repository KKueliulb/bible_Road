import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { updateUser } from '../../services/usersService';
import { colors } from '../../constants/theme';

const TWO_DAYS_MS = 2 * 86400000;

/**
 * 24시간을 실제로 기다리지 않고도 "며칠 안 읽어서 밀린 장수가 생긴" 상태를
 * 강제로 만들어보는 개발용 버튼. __DEV__는 production 빌드에서 false라 자동으로 숨겨진다.
 *
 * 밀린 장수(실시간 부분)는 lastReadAt 기준으로 계산되므로, lastReadAt을 과거로 밀어서
 * 시뮬레이션한다(한 번도 안 읽었으면 지금 시각 기준으로 새로 만듦). 여러 번 누르면 그만큼 더
 * 밀린 것으로 누적된다. createdAt은 lastReadAt이 한 번이라도 설정되면 계산에 쓰이지 않는다.
 */
export default function DevOverdueSimulatorButton() {
  const { userId, user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!__DEV__) return null;

  async function handlePress() {
    if (!userId || !user) return;
    setIsSubmitting(true);
    try {
      const baseline = user.lastReadAt ?? Date.now();
      await updateUser(userId, {
        lastReadAt: baseline - TWO_DAYS_MS,
        lastExtraReadAt: null,
        graceDaysLeft: Math.max(0, user.graceDaysLeft - 1),
      });
      await refreshUser();
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
          <Text style={styles.text}>🕐 [개발용] 이틀 밀린 것으로 시뮬레이션 (여러 번 누르면 더 밀림)</Text>
        )}
      </Pressable>
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
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
