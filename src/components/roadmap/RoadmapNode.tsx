import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Book } from '../../services/booksService';
import { BookProgressStatus } from '../../types/models';
import { colors } from '../../constants/theme';

interface Props {
  book: Book;
  status: BookProgressStatus;
  index: number;
  participantCount: number;
  onPress: () => void;
}

const STATUS_LABEL: Record<BookProgressStatus, string> = {
  completed: '완독',
  in_progress: '진행중',
  not_started: '미시작',
};

export default function RoadmapNode({ book, status, index, participantCount, onPress }: Props) {
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
          {book.order}
        </Text>
      </Pressable>
      <View style={styles.info}>
        <Text style={styles.bookName}>{book.name}</Text>
        <Text style={styles.statusLabel}>
          {STATUS_LABEL[status]} · 전체 {book.totalChapters}장 · 참여 {participantCount}명
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
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
  },
  nodeNotStarted: {
    backgroundColor: '#fff',
    borderColor: colors.border,
  },
  nodeText: {
    fontSize: 16,
    fontWeight: '700',
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
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
