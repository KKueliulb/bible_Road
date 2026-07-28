import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Book } from '../../services/booksService';
import { Participant } from '../../services/participantsService';
import { BookProgressStatus } from '../../types/models';
import { colors, fonts, gradients, radius, spacing, typography } from '../../constants/theme';

interface Props {
  book: Book;
  status: BookProgressStatus;
  index: number;
  /** 온보딩에서 고른 시작 성경 기준 개인화된 1~66 순번 (getDisplayOrder) */
  displayOrder: number;
  chaptersRead: number;
  participantCount: number;
  /** 진행중인 노드에 한해 이름까지 함께 보여준다(그 외 노드는 카운트만). */
  participants?: Participant[];
  onPress: () => void;
}

export const NODE_SIZE = 88;

export default function RoadmapNode({
  book,
  status,
  index,
  displayOrder,
  chaptersRead,
  participantCount,
  participants,
  onPress,
}: Props) {
  const alignRight = index % 2 === 1;
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';
  const gradientColors = isCompleted ? gradients.navy : isInProgress ? gradients.orange : null;

  const nodeContent = (
    <>
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
      <Text style={[styles.nodeProgress, status === 'not_started' ? styles.nodeTextMuted : styles.nodeTextOnColor]}>
        {chaptersRead}/{book.totalChapters}
      </Text>

      {isCompleted && (
        <View style={styles.checkOverlay} pointerEvents="none">
          <Ionicons name="checkmark-circle" size={NODE_SIZE * 0.7} color="rgba(255,255,255,0.55)" />
        </View>
      )}
    </>
  );

  return (
    <View style={[styles.row, alignRight && styles.rowReversed]}>
      <Pressable onPress={onPress}>
        {gradientColors ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.node, isInProgress && styles.nodeInProgressShadow]}
          >
            {nodeContent}
          </LinearGradient>
        ) : (
          <View style={[styles.node, styles.nodeNotStarted]}>{nodeContent}</View>
        )}
      </Pressable>

      {isInProgress && participants ? (
        <View style={styles.participantCard}>
          <View style={styles.participantHeader}>
            <Ionicons name="people" size={14} color={colors.textSecondary} />
            <Text style={styles.participantText}>{participantCount}명</Text>
          </View>
          {participants.length > 0 && (
            <View style={styles.participantChips}>
              {participants.map((participant) => (
                <View key={participant.userId} style={styles.chip}>
                  <Text style={styles.chipText}>{participant.nickname}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.participantBadge}>
          <Ionicons name="people" size={14} color={colors.textSecondary} />
          <Text style={styles.participantText}>{participantCount}명</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
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
    borderColor: 'transparent',
    paddingHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  nodeInProgressShadow: {
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
    fontSize: 13,
    maxWidth: NODE_SIZE - spacing.md,
  },
  nodeProgress: {
    fontFamily: fonts.regular,
    fontSize: 11,
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
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: '#fff',
  },
  participantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  participantCard: {
    flexShrink: 1,
    maxWidth: '60%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
  },
  participantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  participantChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    backgroundColor: colors.orangeLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  chipText: {
    ...typography.smallBold,
    color: colors.orange,
  },
  participantText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
