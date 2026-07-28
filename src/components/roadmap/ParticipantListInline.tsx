import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Participant } from '../../services/participantsService';
import { colors, fonts, radius, spacing, typography } from '../../constants/theme';

interface Props {
  participants: Participant[];
  /** 소속된 노드가 오른쪽 정렬이면 이 카드도 같은 쪽에 붙인다. */
  alignRight: boolean;
}

export default function ParticipantListInline({ participants, alignRight }: Props) {
  if (participants.length === 0) {
    return (
      <View style={[styles.container, alignRight ? styles.containerRight : styles.containerLeft]}>
        <Text style={styles.emptyText}>아직 함께 읽는 사람이 없어요. 첫 번째로 참여해보세요!</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, alignRight ? styles.containerRight : styles.containerLeft]}>
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
    maxWidth: '78%',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  containerLeft: {
    alignSelf: 'flex-start',
    marginLeft: spacing.lg,
  },
  containerRight: {
    alignSelf: 'flex-end',
    marginRight: spacing.lg,
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
