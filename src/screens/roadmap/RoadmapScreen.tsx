import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RoadmapStackParamList } from '../../navigation/RoadmapStack';
import { useAuth } from '../../context/AuthContext';
import { Book, getBookById, getBooksByTestament } from '../../services/booksService';
import { getBookProgressMap } from '../../services/bookProgressService';
import { joinBookParticipants, Participant, subscribeToParticipants } from '../../services/participantsService';
import { computeTodayGoalRange, hasReadToday } from '../../services/readingService';
import { BookProgressDoc, BookProgressStatus, Testament } from '../../types/models';
import HomeTopBar from '../../components/roadmap/HomeTopBar';
import TodayGoalFloatingBar from '../../components/roadmap/TodayGoalFloatingBar';
import TestamentDropdown from '../../components/roadmap/TestamentDropdown';
import RoadmapNode from '../../components/roadmap/RoadmapNode';
import RoadmapConnector from '../../components/roadmap/RoadmapConnector';
import { colors, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<RoadmapStackParamList, 'RoadmapHome'>;

export default function RoadmapScreen({ navigation }: Props) {
  const { userId, user } = useAuth();
  const [testament, setTestament] = useState<Testament>(user?.currentTestament ?? 'OT');
  const [books, setBooks] = useState<Book[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, BookProgressDoc>>({});
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 오늘의 목표 플로팅 바는 현재 보고 있는 테스타먼트와 무관하게 항상 실제 진행중인 책을 보여줘야 한다.
  useEffect(() => {
    if (!user?.currentBookId) return;
    let isCancelled = false;
    getBookById(user.currentBookId).then((book) => {
      if (!isCancelled) setCurrentBook(book ?? null);
    });
    return () => {
      isCancelled = true;
    };
  }, [user?.currentBookId]);

  const getStatus = useCallback(
    (book: Book): BookProgressStatus => {
      if (progressMap[book.id]?.status) return progressMap[book.id].status;
      if (user?.currentBookId === book.id) return 'in_progress';
      return 'not_started';
    },
    [progressMap, user?.currentBookId]
  );

  // 읽기 화면에서 완독/진행 후 로드맵으로 돌아올 때마다 최신 상태를 다시 불러온다.
  // (한 번만 불러오면 완독한 책이 계속 예전 상태로 보이는 문제가 있었음)
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      getBookProgressMap(userId)
        .then(setProgressMap)
        .catch(() => setError('진행 상태를 불러오지 못했어요.'));
    }, [userId])
  );

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    getBooksByTestament(testament)
      .then((result) => {
        if (!isCancelled) setBooks(result);
      })
      .catch(() => {
        if (!isCancelled) setError('책 목록을 불러오지 못했어요. Firebase 설정을 확인해주세요.');
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [testament]);

  // 노드에 참여인원 수를 표시하기 위해, 잠긴(미시작) 책 포함 모든 책의 참여자 수를 가져온다.
  // 각 책의 참여자 수를 실시간(onSnapshot)으로 구독한다. 다른 사람이 참여/이탈하면
  // 포커스 전환 없이도 바로 반영된다. 테스타먼트를 바꾸면 이전 구독은 정리하고 새로 구독한다.
  useEffect(() => {
    if (books.length === 0) return;

    const unsubscribes = books.map((book) =>
      subscribeToParticipants(book.id, (list) => {
        setParticipantCounts((prev) => ({ ...prev, [book.id]: list.length }));
      })
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [books]);

  const inProgressBook = books.find((book) => getStatus(book) === 'in_progress') ?? null;

  // 진행중인 책의 참여자 목록만 이름까지 실시간으로 보여준다.
  useEffect(() => {
    if (!inProgressBook) {
      setParticipants([]);
      return;
    }
    const unsubscribe = subscribeToParticipants(inProgressBook.id, setParticipants);
    return unsubscribe;
  }, [inProgressBook]);

  async function handleNodePress(book: Book, status: BookProgressStatus) {
    if (status === 'not_started') {
      Alert.alert('아직 시작할 수 없어요', '이전 책을 먼저 진행해주세요.');
      return;
    }
    if (status === 'completed') {
      Alert.alert('이미 완독했어요', '완독한 책은 다시 들어갈 수 없어요.');
      return;
    }

    if (userId && user) {
      try {
        await joinBookParticipants(book.id, userId, user.nickname);
      } catch {
        // 참여 등록 실패는 화면 이동을 막지 않음
      }
    }
    navigation.navigate('Reading', { bookId: book.id, bookName: book.name });
  }

  const currentBookProgress = currentBook ? progressMap[currentBook.id] : undefined;
  const currentChaptersReadCount = currentBookProgress?.chaptersRead.length ?? 0;
  const currentBookCompleted = currentBookProgress?.status === 'completed';
  const readToday = hasReadToday(user?.lastReadAt ?? null);
  // 오늘 이미 "읽었어요!"를 눌렀으면 다음날이 되기 전까지는 방금 끝낸 구간을 그대로 보여준다.
  const { start: todayNextStart, end: todayNextEnd } = computeTodayGoalRange(
    currentChaptersReadCount,
    currentBook?.totalChapters ?? 0,
    readToday
  );

  return (
    <View style={styles.root}>
      <HomeTopBar
        streakDays={user?.streakDays ?? 0}
        rereadCount={user?.rereadCount ?? 0}
        nickname={user?.nickname ?? ''}
      />
      {currentBook && (
        <TodayGoalFloatingBar
          bookName={currentBook.name}
          nextStart={todayNextStart}
          nextEnd={todayNextEnd}
          isCompleted={currentBookCompleted}
          readToday={readToday}
        />
      )}

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TestamentDropdown value={testament} onChange={setTestament} />

        {isLoading && <ActivityIndicator color={colors.navy} style={styles.spinner} />}
        {error && <Text style={styles.error}>{error}</Text>}

        {!isLoading &&
          !error &&
          books.map((book, index) => {
            const status = getStatus(book);
            const alignRight = index % 2 === 1;
            return (
              <View key={book.id}>
                <RoadmapNode
                  book={book}
                  status={status}
                  index={index}
                  chaptersRead={progressMap[book.id]?.chaptersRead.length ?? 0}
                  participantCount={participantCounts[book.id] ?? 0}
                  participants={status === 'in_progress' ? participants : undefined}
                  onPress={() => handleNodePress(book, status)}
                />
                {index < books.length - 1 && <RoadmapConnector startRight={alignRight} />}
              </View>
            );
          })}
      </ScrollView>
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
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  spinner: {
    marginTop: spacing.xxl + spacing.sm,
  },
  error: {
    ...typography.body,
    textAlign: 'center',
    color: colors.danger,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
});
