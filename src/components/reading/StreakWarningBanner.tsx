import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface Props {
  graceDaysLeft: number;
  overdueChapters: number;
}

export default function StreakWarningBanner({ graceDaysLeft, overdueChapters }: Props) {
  // 밀린 장수가 없으면(다 따라잡았거나, 유예를 넘겨 이미 정리된 경우 모두 포함) 안내를 띄우지 않는다.
  if (overdueChapters === 0) {
    return null;
  }

  const daysText = graceDaysLeft <= 0 ? '오늘까지입니다!' : `${graceDaysLeft}일 남았습니다!`;
  const message = `🔥 끊어진 불꽃을 다시 태울 수 있는 기회! ${daysText}`;

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
