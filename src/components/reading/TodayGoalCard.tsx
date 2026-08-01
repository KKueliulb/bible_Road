import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GoalSegment, formatGoalSegments } from '../../services/readingService';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface Props {
  bookName: string;
  goalSegments: GoalSegment[];
  overdueChapters: number;
  isCompleted: boolean;
  streakDays: number;
}

export default function TodayGoalCard({ bookName, goalSegments, overdueChapters, isCompleted, streakDays }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        {isCompleted ? (
          <Text style={styles.goalText}>{bookName} 완독을 축하해요! 🎉</Text>
        ) : (
          <Text style={styles.goalText}>오늘의 목표: {formatGoalSegments(goalSegments)}</Text>
        )}
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={16} color={colors.orange} />
          <Text style={styles.streakText}>{streakDays}</Text>
        </View>
      </View>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  goalText: {
    ...typography.bodyBold,
    color: colors.navy,
    flex: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    ...typography.bodyBold,
    color: colors.orange,
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
