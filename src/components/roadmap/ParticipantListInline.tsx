import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Participant } from '../../services/participantsService';
import { colors, fonts, radius, spacing, typography } from '../../constants/theme';

interface Props {
  participants: Participant[];
}

export default function ParticipantListInline({ participants }: Props) {
  if (participants.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>아직 함께 읽는 사람이 없어요. 첫 번째로 참여해보세요!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>함께 읽는 중 ({participants.length}명)</Text>
      <View style={styles.list}>
        {participants.map((participant) => (
          <View key={participant.userId} style={styles.chip}>
            <Text style={styles.chipText}>{participant.nickname}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.sm - 2,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm - 2,
  },
  chip: {
    backgroundColor: colors.orangeLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.xs,
  },
  chipText: {
    ...typography.smallBold,
    color: colors.orange,
    fontFamily: fonts.bold,
  },
  emptyText: {
    ...typography.small,
    color: colors.textSecondary,
  },
});
