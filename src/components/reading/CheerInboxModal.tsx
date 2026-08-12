import React, { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getCheersReceivedToday, hasCheeredToday, ReceivedCheer, sendCheer } from '../../services/cheerLogsService';
import { colors, radius, spacing, typography } from '../../constants/theme';

function seenKey(userId: string): string {
  return `bible_road_seen_cheers_${userId}`;
}

export default function CheerInboxModal() {
  const { userId, user } = useAuth();
  const [cheers, setCheers] = useState<ReceivedCheer[]>([]);
  const [repliedUserIds, setRepliedUserIds] = useState<Set<string>>(new Set());
  const [replyingUserId, setReplyingUserId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // 이 컴포넌트는 홈 로드맵 화면에서만 렌더링된다. 그 화면에 포커스가 올 때마다(다른 탭에서
  // 돌아올 때, 읽기 화면에서 뒤로 나올 때 등) 오늘 받은 화이팅을 다시 확인해서, 아직 안
  // 보여준 것이 있으면 그 자리에서 바로 팝업으로 띄운다. 이미 보여준 화이팅 id는 기기에
  // 저장해 다음에 다시 확인해도 반복해서 뜨지 않게 한다.
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let isCancelled = false;

      async function load() {
        try {
          const received = await getCheersReceivedToday(userId!);
          const seenRaw = await AsyncStorage.getItem(seenKey(userId!));
          const seenIds: string[] = seenRaw ? JSON.parse(seenRaw) : [];
          const unseen = received.filter((cheer) => !seenIds.includes(cheer.id));
          if (isCancelled) return;

          if (unseen.length === 0) {
            setCheers([]);
            setIsVisible(false);
            return;
          }

          const repliedResults = await Promise.all(
            unseen.map(async (cheer) => [cheer.fromUserId, await hasCheeredToday(userId!, cheer.fromUserId)] as const)
          );
          if (isCancelled) return;

          setCheers(unseen);
          setRepliedUserIds(new Set(repliedResults.filter(([, replied]) => replied).map(([id]) => id)));
          setIsVisible(true);
        } catch {
          // 화이팅 알림 조회 실패는 부가 기능이라 조용히 무시
        }
      }

      load();
      return () => {
        isCancelled = true;
      };
    }, [userId])
  );

  async function handleClose() {
    setIsVisible(false);
    if (!userId || cheers.length === 0) return;
    const seenRaw = await AsyncStorage.getItem(seenKey(userId));
    const seenIds: string[] = seenRaw ? JSON.parse(seenRaw) : [];
    const merged = Array.from(new Set([...seenIds, ...cheers.map((cheer) => cheer.id)]));
    await AsyncStorage.setItem(seenKey(userId), JSON.stringify(merged));
  }

  async function handleReply(toUserId: string) {
    if (!userId || !user) return;
    setReplyingUserId(toUserId);
    try {
      await sendCheer(userId, user.nickname, toUserId);
      setRepliedUserIds((prev) => new Set(prev).add(toUserId));
    } catch {
      // 화이팅 답장 실패는 조용히 무시
    } finally {
      setReplyingUserId(null);
    }
  }

  if (cheers.length === 0) return null;

  return (
    <Modal visible={isVisible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>🔥 오늘 받은 화이팅</Text>
          {cheers.map((cheer) => {
            const alreadyReplied = repliedUserIds.has(cheer.fromUserId);
            const isReplying = replyingUserId === cheer.fromUserId;
            return (
              <View key={cheer.id} style={styles.row}>
                <Text style={styles.nickname}>{cheer.fromNickname}님이 화이팅을 보냈어요!</Text>
                <Pressable
                  style={[styles.replyButton, alreadyReplied && styles.replyButtonDisabled]}
                  onPress={() => handleReply(cheer.fromUserId)}
                  disabled={alreadyReplied || isReplying}
                >
                  {isReplying ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.replyButtonText}>{alreadyReplied ? '보냄' : '나도 화이팅!'}</Text>
                  )}
                </Pressable>
              </View>
            );
          })}
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>닫기</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  title: {
    ...typography.h3,
    color: colors.navy,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nickname: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  replyButton: {
    backgroundColor: colors.orange,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  replyButtonDisabled: {
    backgroundColor: colors.border,
  },
  replyButtonText: {
    ...typography.smallBold,
    color: '#fff',
  },
  closeButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  closeButtonText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
