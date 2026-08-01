import React, { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View, ViewToken } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { RankingEntry, subscribeToRanking } from '../../services/usersService';
import { useUserGroups } from '../../hooks/useUserGroups';
import RankingPodium from '../../components/ranking/RankingPodium';
import RankingListRow from '../../components/ranking/RankingListRow';
import SegmentedTabs from '../../components/common/SegmentedTabs';
import { colors, radius, spacing, typography } from '../../constants/theme';

const LIST_LIMIT = 50;

type RankingScope = 'group' | 'all';

const SCOPE_OPTIONS: { value: RankingScope; label: string }[] = [
  { value: 'group', label: '그룹' },
  { value: 'all', label: '전체' },
];

export default function RankingScreen() {
  const { userId } = useAuth();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [isMyRowVisible, setIsMyRowVisible] = useState(true);
  const [scope, setScope] = useState<RankingScope>('all');

  const { groups: myGroups, activeGroupId, setActiveGroupId, groupMemberIds } = useUserGroups(userId);
  const groupTabOptions = myGroups.map((g) => ({ value: g.groupId, label: g.groupName }));

  useEffect(() => {
    const unsubscribe = subscribeToRanking(setRanking);
    return unsubscribe;
  }, []);

  const visibleRanking = scope === 'group' ? ranking.filter((entry) => groupMemberIds.has(entry.userId)) : ranking;

  // FlatList는 onViewableItemsChanged/viewabilityConfig를 렌더마다 새 참조로 바꾸는 걸 지원하지 않으므로
  // ref로 한 번만 만들고, 최신 userId는 별도 ref로 들여다본다.
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const visible = viewableItems.some((v) => (v.item as RankingEntry | undefined)?.userId === userIdRef.current);
    setIsMyRowVisible(visible);
  }).current;

  const top3 = visibleRanking.slice(0, 3);
  const listData = visibleRanking.slice(0, LIST_LIMIT);
  const myIndex = visibleRanking.findIndex((entry) => entry.userId === userId);
  const myEntry = myIndex >= 0 ? visibleRanking[myIndex] : null;

  const emptyText =
    scope === 'group' && myGroups.length === 0
      ? '아직 가입한 그룹이 없어요. 마이페이지에서 그룹을 만들거나 참가해보세요.'
      : '아직 참여한 유저가 없어요.';

  return (
    <View style={styles.root}>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        data={listData}
        keyExtractor={(item) => item.userId}
        ListHeaderComponent={
          <View>
            <SegmentedTabs options={SCOPE_OPTIONS} value={scope} onChange={setScope} />
            {scope === 'group' && groupTabOptions.length > 1 && (
              <SegmentedTabs
                options={groupTabOptions}
                value={activeGroupId ?? groupTabOptions[0].value}
                onChange={setActiveGroupId}
              />
            )}
            <RankingPodium top3={top3} myUserId={userId} />
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        renderItem={({ item, index }) => (
          <RankingListRow entry={item} rank={index + 1} isMe={item.userId === userId} />
        )}
      />

      {myEntry && !isMyRowVisible && (
        <View style={styles.myRankBar}>
          <RankingListRow entry={myEntry} rank={myIndex + 1} isMe elevated />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  empty: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xxl + spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  myRankBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
