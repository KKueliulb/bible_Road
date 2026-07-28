import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { RankingEntry, subscribeToRanking } from '../../services/usersService';
import { colors } from '../../constants/theme';

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
        return (
          <View style={[styles.row, isMe && styles.rowMe]}>
            <Text style={[styles.rank, isMe && styles.textMe]}>{index + 1}</Text>
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
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowMe: {
    backgroundColor: '#FFF3E9',
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  rank: {
    width: 32,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  nickname: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    marginRight: 8,
  },
  percent: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.navy,
  },
  textMe: {
    color: colors.orange,
  },
  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 40,
  },
});
