import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';

interface Props {
  bookName: string;
  nextStart: number;
  nextEnd: number;
  overdueChapters: number;
  isCompleted: boolean;
}

export default function TodayGoalCard({ bookName, nextStart, nextEnd, overdueChapters, isCompleted }: Props) {
  return (
    <View style={styles.card}>
      {isCompleted ? (
        <Text style={styles.goalText}>{bookName} 완독을 축하해요! 🎉</Text>
      ) : (
        <Text style={styles.goalText}>
          오늘의 목표: {bookName} {nextStart}장 ~ {nextEnd}장
        </Text>
      )}
      <Text style={styles.overdueText}>
        {overdueChapters > 0 ? `밀린 장수: ${overdueChapters}장` : '밀린 장 없이 정상 진행 중이에요'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F6F8',
  },
  goalText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
  },
  overdueText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
});
