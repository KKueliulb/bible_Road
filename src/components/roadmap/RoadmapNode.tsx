import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Book } from '../../services/booksService';
import { BookProgressStatus } from '../../types/models';
import { colors, fonts, spacing, typography } from '../../constants/theme';

interface Props {
  book: Book;
  status: BookProgressStatus;
  index: number;
  displayOrder: number;
  participantCount: number;
  onPress: () => void;
}

const STATUS_LABEL: Record<BookProgressStatus, string> = {
  completed: '완독',
  in_progress: '진행중',
  not_started: '미시작',
};

const STATUS_COLOR: Record<BookProgressStatus, string> = {
  completed: colors.navy,
  in_progress: colors.orange,
  not_started: colors.textSecondary,
};

export default function RoadmapNode({ book, status, index, displayOrder, participantCount, onPress }: Props) {
  const alignRight = index % 2 === 1;

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
        <Text
          style={[
            styles.nodeText,
            status === 'not_started' ? styles.nodeTextMuted : styles.nodeTextOnColor,
          ]}
        >
          {displayOrder}
        </Text>
      </Pressable>
      <View style={styles.info}>
        <Text style={styles.bookName}>{book.name}</Text>
        <Text style={styles.statusLabel}>
          <Text style={[styles.statusLabelBold, { color: STATUS_COLOR[status] }]}>
            {STATUS_LABEL[status]}
          </Text>
          {' · 전체 '}
          {book.totalChapters}
          {'장 · 참여 '}
          {participantCount}
          {'명'}
        </Text>
      </View>
    </View>
  );
}

const NODE_SIZE = 48;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
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
  nodeText: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  nodeTextOnColor: {
    color: '#fff',
  },
  nodeTextMuted: {
    color: colors.textSecondary,
  },
  info: {
    flexShrink: 1,
  },
  bookName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  statusLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusLabelBold: {
    fontFamily: fonts.bold,
  },
});
