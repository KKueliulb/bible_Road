import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { updateUser } from '../../services/usersService';
import { DAILY_CHAPTER_GOAL } from '../../constants/readingConfig';
import { colors } from '../../constants/theme';

/**
 * 24시간을 실제로 기다리지 않고도 "어제 하루 안 읽어서 밀린 장수가 생긴" 상태를
 * 강제로 만들어보는 개발용 버튼. __DEV__는 production 빌드에서 false라 자동으로 숨겨진다.
 */
export default function DevOverdueSimulatorButton() {
  const { userId, user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!__DEV__) return null;

  async function handlePress() {
    if (!userId || !user) return;
    setIsSubmitting(true);
    try {
      const twoDaysAgo = Date.now() - 2 * 86400000;
      await updateUser(userId, {
        lastReadAt: twoDaysAgo,
        overdueChapters: DAILY_CHAPTER_GOAL,
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
          <Text style={styles.text}>🕐 [개발용] 어제 안 읽은 것으로 시뮬레이션</Text>
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
  },
});
