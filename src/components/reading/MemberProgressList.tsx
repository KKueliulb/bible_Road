import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Participant } from '../../services/participantsService';
import { colors } from '../../constants/theme';

interface Props {
  participants: Participant[];
  currentUserId: string;
  cheeredUserIds: Set<string>;
  cheeringUserId: string | null;
  onCheer: (toUserId: string) => void;
}

export default function MemberProgressList({
  participants,
  currentUserId,
  cheeredUserIds,
  cheeringUserId,
  onCheer,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>함께 읽는 사람들 ({participants.length}명)</Text>
      {participants.map((participant) => {
        const isMe = participant.userId === currentUserId;
        const alreadyCheered = cheeredUserIds.has(participant.userId);
        const isCheering = cheeringUserId === participant.userId;

        return (
          <View key={participant.userId} style={styles.row}>
            <Text style={styles.nickname}>
              {participant.nickname}
              {isMe ? ' (나)' : ''}
            </Text>
            {!isMe && (
              <Pressable
                style={[styles.cheerButton, alreadyCheered && styles.cheerButtonDisabled]}
                onPress={() => onCheer(participant.userId)}
                disabled={alreadyCheered || isCheering}
              >
                {isCheering ? (
                  <ActivityIndicator size="small" color={colors.orange} />
                ) : (
                  <Text style={[styles.cheerText, alreadyCheered && styles.cheerTextDisabled]}>
                    {alreadyCheered ? '오늘 보냄' : '화이팅!'}
                  </Text>
                )}
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nickname: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  cheerButton: {
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cheerButtonDisabled: {
    borderColor: colors.border,
  },
  cheerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.orange,
  },
  cheerTextDisabled: {
    color: colors.textSecondary,
  },
});
