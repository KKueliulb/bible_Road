import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RankingEntry } from '../../services/usersService';
import Avatar from '../common/Avatar';
import ProgressBar from './ProgressBar';
import { colors, fonts, radius, spacing, typography } from '../../constants/theme';

interface Props {
  entry: RankingEntry;
  rank: number;
  isMe: boolean;
  /** 시상대(TOP 3)에도 등장하는 행이라 강조 배경 없이 옅은 배경만 쓰고 싶을 때 사용(하단 고정 바 등). */
  elevated?: boolean;
}

export default function RankingListRow({ entry, rank, isMe, elevated }: Props) {
  return (
    <View style={[styles.row, isMe && styles.rowMe, elevated && styles.rowElevated]}>
      <Text style={[styles.rank, isMe && styles.textMe]}>{rank}</Text>
      <Avatar createdAt={entry.createdAt} size={32} />
      <View style={styles.nameColumn}>
        <Text style={[styles.nickname, isMe && styles.textMe]} numberOfLines={1}>
          {entry.nickname}
          <Text style={styles.nameSuffix}>{isMe ? ' (나)' : ` (${entry.name})`}</Text>
        </Text>
        {entry.currentBookName !== '' && (
          <Text style={styles.readingPosition} numberOfLines={1}>
            {entry.currentBookName} {entry.currentChapter}/{entry.currentBookTotalChapters}
          </Text>
        )}
        <ProgressBar percent={entry.totalProgressPercent} color={isMe ? colors.orange : colors.navy} />
      </View>
      <Text style={[styles.percent, isMe && styles.textMe]}>{entry.totalProgressPercent.toFixed(1)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowMe: {
    backgroundColor: colors.orangeLight,
    borderRadius: radius.md,
    borderBottomWidth: 0,
  },
  rowElevated: {
    borderBottomWidth: 0,
  },
  rank: {
    width: 30,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.textSecondary,
  },
  nameColumn: {
    flex: 1,
    marginRight: spacing.sm,
    gap: 4,
  },
  nickname: {
    ...typography.body,
    color: colors.textPrimary,
  },
  nameSuffix: {
    ...typography.small,
    color: colors.textSecondary,
  },
  readingPosition: {
    ...typography.small,
    color: colors.textSecondary,
  },
  percent: {
    ...typography.bodyBold,
    color: colors.navy,
    width: 52,
    textAlign: 'right',
  },
  textMe: {
    color: colors.orange,
  },
});
