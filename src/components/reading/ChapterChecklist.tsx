import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';

interface Props {
  totalChapters: number;
  chaptersRead: number[];
}

export default function ChapterChecklist({ totalChapters, chaptersRead }: Props) {
  const readSet = new Set(chaptersRead);
  const chapters = Array.from({ length: totalChapters }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        체크리스트 ({chaptersRead.length}/{totalChapters}장)
      </Text>
      <View style={styles.grid}>
        {chapters.map((chapter) => {
          const isRead = readSet.has(chapter);
          return (
            <View key={chapter} style={[styles.cell, isRead && styles.cellRead]}>
              <Text style={[styles.cellText, isRead && styles.cellTextRead]}>{chapter}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const CELL_SIZE = 32;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellRead: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  cellText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cellTextRead: {
    color: '#fff',
    fontWeight: '600',
  },
});
