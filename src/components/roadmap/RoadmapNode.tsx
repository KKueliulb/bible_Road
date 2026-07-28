import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Book } from '../../services/booksService';
import { BookProgressStatus } from '../../types/models';
import { colors, fonts, spacing, typography } from '../../constants/theme';

interface Props {
  book: Book;
  status: BookProgressStatus;
  index: number;
  /** 온보딩에서 고른 시작 성경 기준 개인화된 1~66 순번 (getDisplayOrder) */
  displayOrder: number;
  chaptersRead: number;
  participantCount: number;
  onPress: () => void;
}

export const NODE_SIZE = 104;

export default function RoadmapNode({
  book,
  status,
  index,
  displayOrder,
  chaptersRead,
  participantCount,
  onPress,
}: Props) {
  const alignRight = index % 2 === 1;
  const isCompleted = status === 'completed';

  return (
    <View style={[styles.row, alignRight && styles.rowReversed]}>
      <Pressable
        onPress={onPress}
        style={[
          styles.node,
          status === 'completed' && styles.nodeCompleted,
          status === 'in_progress' && styles.nodeInProgress,
          status === 'not_started' && styles.nodeNotStarted,
        ]}
      >
        <View style={styles.orderBadge}>
          <Text style={styles.orderBadgeText}>{displayOrder}</Text>
        </View>
        <Text
          style={[styles.nodeName, status === 'not_started' ? styles.nodeTextMuted : styles.nodeTextOnColor]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {book.name}
        </Text>
        <Text
          style={[styles.nodeProgress, status === 'not_started' ? styles.nodeTextMuted : styles.nodeTextOnColor]}
        >
          {chaptersRead}/{book.totalChapters}
        </Text>

        {isCompleted && (
          <View style={styles.checkOverlay} pointerEvents="none">
            <Ionicons name="checkmark-circle" size={NODE_SIZE * 0.7} color="rgba(255,255,255,0.55)" />
          </View>
        )}
      </Pressable>

      <View style={styles.participantBadge}>
        <Ionicons name="people" size={14} color={colors.textSecondary} />
        <Text style={styles.participantText}>{participantCount}명</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  rowReversed: {
    flexDirection: 'row-reverse',
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    paddingHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  nodeCompleted: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  nodeInProgress: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
    shadowColor: colors.orange,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  nodeNotStarted: {
    backgroundColor: '#fff',
    borderColor: colors.border,
  },
  nodeName: {
    fontFamily: fonts.bold,
    fontSize: 15,
    maxWidth: NODE_SIZE - spacing.md,
  },
  nodeProgress: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
  },
  nodeTextOnColor: {
    color: '#fff',
  },
  nodeTextMuted: {
    color: colors.textSecondary,
  },
  checkOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#fff',
  },
  participantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  participantText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
