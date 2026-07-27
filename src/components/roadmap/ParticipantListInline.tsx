import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Participant } from '../../services/participantsService';
import { colors } from '../../constants/theme';

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
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: '#FFF1E6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 12,
    color: colors.orange,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
