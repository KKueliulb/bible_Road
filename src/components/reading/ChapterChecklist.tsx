import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing, typography } from '../../constants/theme';

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
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  title: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm - 2,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: radius.sm - 2,
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
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  cellTextRead: {
    color: '#fff',
    fontFamily: fonts.bold,
  },
});
