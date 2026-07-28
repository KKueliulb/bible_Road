import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Participant } from '../../services/participantsService';
import { colors, radius, spacing, typography } from '../../constants/theme';

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
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.bodyBold,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nickname: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  cheerButton: {
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  cheerButtonDisabled: {
    borderColor: colors.border,
  },
  cheerText: {
    ...typography.smallBold,
    color: colors.orange,
  },
  cheerTextDisabled: {
    color: colors.textSecondary,
  },
});
