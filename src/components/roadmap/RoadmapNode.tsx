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
  chaptersRead,
  participantCount,
  participants,
  onPress,
}: Props) {
  const alignRight = index % 2 === 1;
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';

  const nodeContent = (
    <>
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
      {isCompleted && <Text style={[styles.nodeProgress, styles.nodeTextOnColor]}>완독</Text>}
    </>
  );

  return (
    <View style={[styles.row, alignRight && styles.rowReversed]}>
      <View style={styles.nodeContainer}>
        <Pressable onPress={onPress}>
          {isInProgress || isCompleted ? (
            <LinearGradient
              colors={isCompleted ? gradients.navy : gradients.orange}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.node}
            >
              {nodeContent}
            </LinearGradient>
          ) : (
            <View style={[styles.node, styles.nodeNotStarted]}>{nodeContent}</View>
          )}
        </Pressable>
      </View>

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
  nodeContainer: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
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
