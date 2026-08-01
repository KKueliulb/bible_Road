import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GoalSegment, formatGoalSegments } from '../../services/readingService';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface Props {
  bookName: string;
  goalSegments: GoalSegment[];
  isCompleted: boolean;
  readToday: boolean;
}

export default function TodayGoalFloatingBar({ bookName, goalSegments, isCompleted, readToday }: Props) {
  return (
    <View style={[styles.card, readToday && styles.cardDone]}>
      <View style={styles.textGroup}>
        <Text style={styles.label}>오늘의 목표</Text>
        {isCompleted ? (
          <Text style={styles.goal}>{bookName} 완독을 축하해요! 🎉</Text>
        ) : (
          <Text style={styles.goal}>{formatGoalSegments(goalSegments)}</Text>
        )}
      </View>
      {readToday && !isCompleted && (
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark" size={18} color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    shadowColor: colors.navy,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardDone: {
    backgroundColor: colors.successLight,
  },
  textGroup: {
    flexShrink: 1,
  },
  label: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  goal: {
    ...typography.bodyBold,
    color: colors.navy,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});
