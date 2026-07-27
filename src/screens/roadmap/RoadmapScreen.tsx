import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RoadmapStackParamList } from '../../navigation/RoadmapStack';
import { useAuth } from '../../context/AuthContext';
import { Book, getBooksByTestament } from '../../services/booksService';
import { getBookProgressMap } from '../../services/bookProgressService';
import { getParticipants, joinBookParticipants, Participant } from '../../services/participantsService';
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

  const inProgressBook = books.find((book) => getStatus(book) === 'in_progress') ?? null;

  useEffect(() => {
    if (!inProgressBook) {
      setParticipants([]);
      return;
    }
    getParticipants(inProgressBook.id)
      .then(setParticipants)
      .catch(() => setParticipants([]));
  }, [inProgressBook]);

  async function handleNodePress(book: Book) {
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
                onPress={() => handleNodePress(book)}
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
