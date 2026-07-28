import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface Props {
  bookName: string;
  nextStart: number;
  nextEnd: number;
  overdueChapters: number;
  isCompleted: boolean;
}

export default function TodayGoalCard({ bookName, nextStart, nextEnd, overdueChapters, isCompleted }: Props) {
  return (
    <View style={styles.card}>
      {isCompleted ? (
        <Text style={styles.goalText}>{bookName} 완독을 축하해요! 🎉</Text>
      ) : (
        <Text style={styles.goalText}>
          오늘의 목표: {bookName} {nextStart}장 ~ {nextEnd}장
        </Text>
      )}
      <Text style={[styles.overdueText, overdueChapters > 0 ? styles.overdueTextWarning : styles.overdueTextOk]}>
        {overdueChapters > 0 ? `밀린 장수: ${overdueChapters}장` : '밀린 장 없이 정상 진행 중이에요'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  goalText: {
    ...typography.bodyBold,
    color: colors.navy,
  },
  overdueText: {
    ...typography.caption,
    marginTop: spacing.sm - 2,
  },
  overdueTextWarning: {
    color: colors.danger,
    fontFamily: typography.captionBold.fontFamily,
  },
  overdueTextOk: {
    color: colors.success,
  },
});
