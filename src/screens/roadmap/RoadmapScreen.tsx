import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { BookProgressDoc, BookProgressStatus, Testament } from '../../types/models';
import TestamentDropdown from '../../components/roadmap/TestamentDropdown';
import RoadmapNode from '../../components/roadmap/RoadmapNode';
import ParticipantListInline from '../../components/roadmap/ParticipantListInline';
import { colors } from '../../constants/theme';

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

  useEffect(() => {
    if (!userId) return;
    getBookProgressMap(userId)
      .then(setProgressMap)
      .catch(() => setError('진행 상태를 불러오지 못했어요.'));
  }, [userId]);

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
  // (테스타먼트 전환 시 한 번씩 갱신 — 실시간까지는 필요 없다고 판단)
  useEffect(() => {
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
    paddingBottom: 32,
  },
  spinner: {
    marginTop: 40,
  },
  error: {
    textAlign: 'center',
    color: colors.danger,
    marginTop: 24,
    paddingHorizontal: 24,
  },
});
