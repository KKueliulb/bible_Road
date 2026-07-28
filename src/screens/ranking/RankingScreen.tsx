import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { RankingEntry, subscribeToRanking } from '../../services/usersService';
import { colors, fonts, radius, spacing, typography } from '../../constants/theme';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function RankingScreen() {
  const { userId } = useAuth();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToRanking(setRanking);
    return unsubscribe;
  }, []);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={ranking}
      keyExtractor={(item) => item.userId}
      ListEmptyComponent={<Text style={styles.empty}>아직 참여한 유저가 없어요.</Text>}
      renderItem={({ item, index }) => {
        const isMe = item.userId === userId;
        const medal = MEDAL[index];
        return (
          <View style={[styles.row, isMe && styles.rowMe]}>
            <Text style={[styles.rank, isMe && styles.textMe]}>{medal ?? index + 1}</Text>
            <Text style={[styles.nickname, isMe && styles.textMe]} numberOfLines={1}>
              {item.nickname}
              {isMe ? ' (나)' : ''}
            </Text>
            <Text style={[styles.percent, isMe && styles.textMe]}>{item.totalProgressPercent.toFixed(1)}%</Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowMe: {
    backgroundColor: colors.orangeLight,
    borderRadius: radius.md,
    borderBottomWidth: 0,
  },
  rank: {
    width: 36,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textSecondary,
  },
  nickname: {
    ...typography.body,
    flex: 1,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  percent: {
    ...typography.bodyBold,
    color: colors.navy,
  },
  textMe: {
    color: colors.orange,
  },
  empty: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xxl + spacing.sm,
  },
});
