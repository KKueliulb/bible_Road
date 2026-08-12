import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../constants/theme';

interface Props {
  streakDays: number;
  rereadCount: number;
  nickname: string;
}

export default function HomeTopBar({ streakDays, rereadCount, nickname }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.side}>
        <Ionicons name="flame" size={18} color={colors.orange} />
        <Text style={styles.sideText}>연속 {streakDays}일</Text>
      </View>
      <View style={styles.center}>
        <Ionicons name="book" size={16} color={colors.navy} />
        <Text style={styles.centerText}>{rereadCount}회독</Text>
      </View>
      <View style={[styles.side, styles.sideRight]}>
        <Text style={styles.nicknameText} numberOfLines={1}>
          {nickname}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  center: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sideText: {
    ...typography.captionBold,
    color: colors.textPrimary,
  },
  centerText: {
    ...typography.captionBold,
    color: colors.navy,
  },
  nicknameText: {
    ...typography.bodyBold,
    color: colors.navy,
  },
});
