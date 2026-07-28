import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface Props {
  graceDaysLeft: number;
  overdueChapters: number;
}

export default function StreakWarningBanner({ graceDaysLeft, overdueChapters }: Props) {
  if (graceDaysLeft >= 2 && overdueChapters === 0) {
    return null;
  }

  const message =
    graceDaysLeft <= 0
      ? '유예 기간을 모두 사용했어요. 오늘 읽지 않으면 연속 기록이 끊겨요!'
      : `스트릭 유예 ${graceDaysLeft}일 남았어요. 꾸준히 읽어서 기록을 지켜보세요.`;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.orangeLight,
  },
  text: {
    ...typography.captionBold,
    color: colors.orange,
  },
});
