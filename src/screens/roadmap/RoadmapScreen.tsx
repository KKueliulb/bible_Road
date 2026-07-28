import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RoadmapStackParamList } from '../../navigation/RoadmapStack';
import { useAuth } from '../../context/AuthContext';
import { Book, getBooksByTestament } from '../../services/booksService';
import { getBookProgressMap } from '../../services/bookProgressService';
import {
  getParticipants,
  joinBookParticipants,
  Participant,
  subscribeToParticipants,
} from '../../services/participantsService';
import { getDisplayOrder } from '../../data/books';
import { BookProgressDoc, BookProgressStatus, Testament } from '../../types/models';
import TestamentDropdown from '../../components/roadmap/TestamentDropdown';
import RoadmapNode from '../../components/roadmap/RoadmapNode';
import ParticipantListInline from '../../components/roadmap/ParticipantListInline';
import { colors, spacing, typography } from '../../constants/theme';

type Props = NativeStackScreenProps<RoadmapStackParamList, 'RoadmapHome'>;

export default function RoadmapScreen({ navigation }: Props) {
  const { userId, user } = useAuth();
  const [testament, setTestament] = useState<Testament>(user?.currentTestament ?? 'OT');
  const [books, setBooks] = useState<Book[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, BookProgressDoc>>({});
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  // 테스타먼트 전환 시뿐 아니라, 읽기 화면에서 돌아와 화면이 다시 포커스될 때도 갱신한다
  // (그렇지 않으면 책을 완독해 다음 책으로 자동 참여해도 숫자가 갱신되지 않음).
  useFocusEffect(
    useCallback(() => {
      if (books.length === 0) return;
      let isCancelled = false;

      Promise.all(books.map((book) => getParticipants(book.id).then((list) => [book.id, list.length] as const)))
        .then((entries) => {
          if (!isCancelled) setParticipantCounts(Object.fromEntries(entries));
        })
        .catch(() => {
          // 참여인원 수 표시는 부가 정보라 실패해도 화면을 막지 않음
        });

      return () => {
        isCancelled = true;
      };
    }, [books])
  );

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

    if (userId && user) {
      try {
        await joinBookParticipants(book.id, userId, user.nickname);
      } catch {
        // 참여 등록 실패는 화면 이동을 막지 않음
      }
    }
    navigation.navigate('Reading', { bookId: book.id, bookName: book.name });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TestamentDropdown value={testament} onChange={setTestament} />

      {isLoading && <ActivityIndicator color={colors.navy} style={styles.spinner} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {!isLoading &&
        !error &&
        books.map((book, index) => {
          const status = getStatus(book);
          return (
            <View key={book.id}>
              <RoadmapNode
                book={book}
                status={status}
                index={index}
                displayOrder={getDisplayOrder(book, user?.roadmapStartTestament ?? 'OT')}
                participantCount={participantCounts[book.id] ?? 0}
                onPress={() => handleNodePress(book, status)}
              />
              {status === 'in_progress' && <ParticipantListInline participants={participants} />}
            </View>
          );
        })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
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
