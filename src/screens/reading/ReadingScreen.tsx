import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RoadmapStackParamList } from '../../navigation/RoadmapStack';
import { useAuth } from '../../context/AuthContext';
import { Book, getBookById } from '../../services/booksService';
import { getBookProgressMap } from '../../services/bookProgressService';
import { Participant, subscribeToParticipants } from '../../services/participantsService';
import { hasCheeredToday, sendCheer } from '../../services/cheerLogsService';
import { hasPokedToday, logPoke } from '../../services/pokeLogsService';
import { sendPokePush } from '../../services/pokeService';
import { getUserById } from '../../services/usersService';
import {
  computeLiveGraceDaysLeft,
  computeLiveOverdueChapters,
  computeLiveStreakDays,
  computeTodayGoalSegments,
  hasReadToday,
  recordChaptersRead,
} from '../../services/readingService';
import { getPersonalizedSequence } from '../../data/books';
import { BookProgressDoc } from '../../types/models';
import { DAILY_CHAPTER_GOAL } from '../../constants/readingConfig';
import TodayGoalCard from '../../components/reading/TodayGoalCard';
import StreakWarningBanner from '../../components/reading/StreakWarningBanner';
import ChapterChecklist from '../../components/reading/ChapterChecklist';
import ReadButton from '../../components/reading/ReadButton';
import ExtraReadDropdownButton from '../../components/reading/ExtraReadDropdownButton';
import MemberProgressList from '../../components/reading/MemberProgressList';
import { colors, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<RoadmapStackParamList, 'Reading'>;

export default function ReadingScreen({ route }: Props) {
  const { bookId } = route.params;
  const { userId, user, refreshUser } = useAuth();

  const [book, setBook] = useState<Book | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, BookProgressDoc>>({});
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [cheeredUserIds, setCheeredUserIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingRead, setIsSubmittingRead] = useState(false);
  const [isSubmittingExtra, setIsSubmittingExtra] = useState(false);
  const [cheeringUserId, setCheeringUserId] = useState<string | null>(null);
  const [notReadTodayUserIds, setNotReadTodayUserIds] = useState<Set<string>>(new Set());
  const [pokedUserIds, setPokedUserIds] = useState<Set<string>>(new Set());
  const [pokingUserId, setPokingUserId] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [bookResult, progressMapResult] = await Promise.all([
          getBookById(bookId),
          userId ? getBookProgressMap(userId) : Promise.resolve({}),
        ]);
        if (isCancelled) return;

        setBook(bookResult ?? null);
        setProgressMap(progressMapResult);
      } catch {
        if (!isCancelled) setError('데이터를 불러오지 못했어요. Firebase 설정을 확인해주세요.');
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      isCancelled = true;
    };
  }, [bookId, userId]);

  // 참여자 목록은 실시간으로 구독한다.
  useEffect(() => {
    const unsubscribe = subscribeToParticipants(bookId, setParticipants);
    return unsubscribe;
  }, [bookId]);

  // 참여자 목록이 바뀔 때마다(새로 들어옴 등) 화이팅 전송 여부를 다시 확인한다.
  useEffect(() => {
    if (!userId) return;
    let isCancelled = false;

    const others = participants.filter((p) => p.userId !== userId);
    Promise.all(others.map(async (p) => [p.userId, await hasCheeredToday(userId, p.userId)] as const))
      .then((results) => {
        if (!isCancelled) {
          setCheeredUserIds(new Set(results.filter(([, cheered]) => cheered).map(([id]) => id)));
        }
      })
      .catch(() => {
        // 화이팅 전송 여부 확인 실패는 부가 정보라 무시
      });

    return () => {
      isCancelled = true;
    };
  }, [participants, userId]);

  // 참여자 목록이 바뀔 때마다 각자 오늘 읽었는지(찌르기 대상인지)와 오늘 이미 찌른 사람인지를 다시 확인한다.
  useEffect(() => {
    if (!userId) return;
    let isCancelled = false;

    const others = participants.filter((p) => p.userId !== userId);
    Promise.all(
      others.map(async (p) => {
        const [otherUser, poked] = await Promise.all([getUserById(p.userId), hasPokedToday(userId, p.userId)]);
        return { userId: p.userId, notReadToday: !hasReadToday(otherUser?.lastReadAt ?? null), poked };
      })
    )
      .then((results) => {
        if (isCancelled) return;
        setNotReadTodayUserIds(new Set(results.filter((r) => r.notReadToday).map((r) => r.userId)));
        setPokedUserIds(new Set(results.filter((r) => r.poked).map((r) => r.userId)));
      })
      .catch(() => {
        // 찌르기 가능 여부 확인 실패는 부가 정보라 무시(버튼이 안 보이는 정도로 그침)
      });

    return () => {
      isCancelled = true;
    };
  }, [participants, userId]);

  if (isLoading) {
    return <ActivityIndicator color={colors.navy} style={styles.spinner} />;
  }

  if (error || !book || !userId || !user) {
    return <Text style={styles.error}>{error ?? '책 정보를 찾을 수 없어요.'}</Text>;
  }

  const progress = progressMap[book.id] ?? null;
  const chaptersReadCount = progress?.chaptersRead.length ?? 0;
  const isCompleted = progress?.status === 'completed';
  const remaining = book.totalChapters - chaptersReadCount;
  const readToday = hasReadToday(user.lastReadAt);
  const extraUsedToday = hasReadToday(user.lastExtraReadAt);
  // 오늘 이미 "읽었어요!"를 눌렀으면 다음날이 되기 전까지는 방금 끝낸 구간을 그대로 보여준다.
  const goalSegments = computeTodayGoalSegments(
    getPersonalizedSequence(user.roadmapStartTestament ?? 'OT'),
    book.id,
    chaptersReadCount,
    readToday
  );

  function otherBooksTotal() {
    return Object.entries(progressMap)
      .filter(([id]) => id !== book!.id)
      .reduce((sum, [, p]) => sum + p.chaptersRead.length, 0);
  }

  // 원금(공백 확정분) + 진행중 미확정 공백 - 상환액을 화면을 볼 때마다 그 자리에서 다시 계산한다.
  // "읽었어요!"는 이 값을 바꾸지 않고, "N장 더 읽었어요!"로 상환해야만 줄어든다.
  const liveOverdueChapters = computeLiveOverdueChapters(user);
  const extraAvailable = Math.min(liveOverdueChapters, remaining);

  async function handleRead() {
    if (!userId || !user || !book) return;
    setIsSubmittingRead(true);
    try {
      const { progress: newProgress } = await recordChaptersRead({
        userId,
        user,
        book,
        existingProgress: progress,
        chapterCount: DAILY_CHAPTER_GOAL,
        actionType: 'base',
        otherBooksChaptersReadTotal: otherBooksTotal(),
      });
      setProgressMap((prev) => ({ ...prev, [book.id]: newProgress }));
      await refreshUser();
    } catch {
      setError('읽음 처리에 실패했어요.');
    } finally {
      setIsSubmittingRead(false);
    }
  }

  async function handleExtra(chapterCount: number) {
    if (!userId || !user || !book) return;
    setIsSubmittingExtra(true);
    try {
      const { progress: newProgress } = await recordChaptersRead({
        userId,
        user,
        book,
        existingProgress: progress,
        chapterCount,
        actionType: 'extra',
        otherBooksChaptersReadTotal: otherBooksTotal(),
      });
      setProgressMap((prev) => ({ ...prev, [book.id]: newProgress }));
      await refreshUser();
    } catch {
      setError('읽음 처리에 실패했어요.');
    } finally {
      setIsSubmittingExtra(false);
    }
  }

  async function handleCheer(toUserId: string) {
    if (!userId || !user) return;
    setCheeringUserId(toUserId);
    try {
      await sendCheer(userId, user.nickname, toUserId);
      setCheeredUserIds((prev) => new Set(prev).add(toUserId));
    } catch {
      // 화이팅 전송 실패는 조용히 무시 (치명적이지 않음)
    } finally {
      setCheeringUserId(null);
    }
  }

  async function handlePoke(toUserId: string) {
    if (!userId || !user) return;
    setPokingUserId(toUserId);
    try {
      await sendPokePush(user.nickname, toUserId);
      await logPoke(userId, toUserId);
      setPokedUserIds((prev) => new Set(prev).add(toUserId));
    } catch {
      // 찌르기 전송 실패는 조용히 무시 (치명적이지 않음)
    } finally {
      setPokingUserId(null);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <TodayGoalCard
        bookName={book.name}
        goalSegments={goalSegments}
        overdueChapters={liveOverdueChapters}
        isCompleted={isCompleted}
        streakDays={computeLiveStreakDays(user)}
      />
      <StreakWarningBanner graceDaysLeft={computeLiveGraceDaysLeft(user)} overdueChapters={liveOverdueChapters} />
      <ChapterChecklist totalChapters={book.totalChapters} chaptersRead={progress?.chaptersRead ?? []} />

      {!isCompleted && (
        <ReadButton onPress={handleRead} isSubmitting={isSubmittingRead} alreadyDoneToday={readToday} />
      )}
      {!isCompleted && extraAvailable > 0 && (
        <ExtraReadDropdownButton
          maxAvailable={extraAvailable}
          isSubmitting={isSubmittingExtra}
          alreadyDoneToday={extraUsedToday}
          onSubmit={handleExtra}
        />
      )}

      <MemberProgressList
        participants={participants}
        currentUserId={userId}
        cheeredUserIds={cheeredUserIds}
        cheeringUserId={cheeringUserId}
        onCheer={handleCheer}
        notReadTodayUserIds={notReadTodayUserIds}
        pokedUserIds={pokedUserIds}
        pokingUserId={pokingUserId}
        onPoke={handlePoke}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  spinner: {
    marginTop: spacing.xxl + spacing.sm,
  },
  error: {
    ...typography.body,
    textAlign: 'center',
    color: colors.danger,
    marginTop: spacing.xxl + spacing.sm,
    paddingHorizontal: spacing.xl,
  },
});
