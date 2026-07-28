import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RankingEntry } from '../../services/usersService';
import Avatar from '../common/Avatar';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface Props {
  top3: RankingEntry[];
  myUserId: string | null;
}

const MEDAL = ['🥇', '🥈', '🥉'];
const STAND_HEIGHT = [92, 64, 48];
const AVATAR_SIZE = [64, 52, 48];
// 화면에는 2등-1등-3등 순서로 배치해 가운데(1등)가 가장 높아 보이게 한다.
const DISPLAY_ORDER = [1, 0, 2];

/** 랭킹 화면 상단의 TOP 3 단상(포디움). */
export default function RankingPodium({ top3, myUserId }: Props) {
  if (top3.length === 0) return null;

  return (
    <View style={styles.container}>
      {DISPLAY_ORDER.filter((i) => top3[i]).map((i) => {
        const entry = top3[i];
        const isMe = entry.userId === myUserId;
        return (
          <View key={entry.userId} style={styles.column}>
            <Text style={styles.medal}>{MEDAL[i]}</Text>
            <Avatar photoURL={entry.photoURL} nickname={entry.nickname} size={AVATAR_SIZE[i]} />
            <Text style={[styles.nickname, isMe && styles.textMe]} numberOfLines={1}>
              {entry.nickname}
            </Text>
            <Text style={styles.nameSuffix} numberOfLines={1}>
              {isMe ? '(나)' : `(${entry.name})`}
            </Text>
            {entry.currentBookName !== '' && (
              <Text style={styles.readingPosition} numberOfLines={1}>
                {entry.currentBookName} {entry.currentChapter}/{entry.currentBookTotalChapters}
              </Text>
            )}
            <Text style={[styles.percent, isMe && styles.textMe]}>{entry.totalProgressPercent.toFixed(1)}%</Text>
            <View
              style={[
                styles.stand,
                { height: STAND_HEIGHT[i] },
                i === 0 ? styles.standFirst : styles.standOther,
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  column: {
    flex: 1,
    maxWidth: 120,
    alignItems: 'center',
  },
  medal: {
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  nickname: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  nameSuffix: {
    ...typography.small,
    color: colors.textSecondary,
  },
  readingPosition: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  percent: {
    ...typography.captionBold,
    color: colors.navy,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  textMe: {
    color: colors.orange,
  },
  stand: {
    width: '85%',
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  standFirst: {
    backgroundColor: colors.orange,
  },
  standOther: {
    backgroundColor: colors.navy,
  },
});
