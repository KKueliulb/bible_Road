import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { GroupMembership, createGroup, findGroupByInviteCode, joinGroup, leaveGroup } from '../../services/groupsService';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface Props {
  userId: string;
  nickname: string;
  groups: GroupMembership[];
}

export default function GroupsCard({ userId, nickname, groups }: Props) {
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);

  const [leavingGroupId, setLeavingGroupId] = useState<string | null>(null);

  async function handleCreateGroup() {
    if (isCreating) return;
    setCreateError(null);
    setIsCreating(true);
    try {
      await createGroup(newGroupName, userId, nickname);
      setNewGroupName('');
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : '그룹을 만들지 못했어요.');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleJoinGroup() {
    if (isJoining) return;
    setJoinError(null);
    setJoinSuccess(false);
    setIsJoining(true);
    try {
      const group = await findGroupByInviteCode(inviteCode);
      if (!group) {
        setJoinError('초대 코드를 찾을 수 없어요.');
        return;
      }
      if (groups.some((g) => g.groupId === group.id)) {
        setJoinError('이미 참가한 그룹이에요.');
        return;
      }
      await joinGroup(group.id, group.name, group.inviteCode, userId, nickname);
      setInviteCode('');
      setJoinSuccess(true);
    } catch {
      setJoinError('그룹 참가에 실패했어요.');
    } finally {
      setIsJoining(false);
    }
  }

  function handleLeaveGroup(group: GroupMembership) {
    Alert.alert('그룹 나가기', `'${group.groupName}' 그룹에서 나갈까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '나가기',
        style: 'destructive',
        onPress: async () => {
          setLeavingGroupId(group.groupId);
          try {
            await leaveGroup(group.groupId, userId);
          } finally {
            setLeavingGroupId(null);
          }
        },
      },
    ]);
  }

  async function handleCopyCode(code: string) {
    await Clipboard.setStringAsync(code);
  }

  return (
    <View>
      {groups.length > 0 && (
        <View style={styles.groupList}>
          {groups.map((group) => (
            <View key={group.groupId} style={styles.groupRow}>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.groupName}</Text>
                <Pressable style={styles.codeRow} onPress={() => handleCopyCode(group.groupInviteCode)} hitSlop={4}>
                  <Text style={styles.codeText}>초대코드 {group.groupInviteCode} (눌러서 복사)</Text>
                </Pressable>
              </View>
              <Pressable
                style={styles.leaveButton}
                onPress={() => handleLeaveGroup(group)}
                disabled={leavingGroupId === group.groupId}
              >
                {leavingGroupId === group.groupId ? (
                  <ActivityIndicator color={colors.textSecondary} size="small" />
                ) : (
                  <Text style={styles.leaveButtonText}>나가기</Text>
                )}
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.formLabel}>그룹 만들기</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={newGroupName}
          onChangeText={setNewGroupName}
          placeholder="그룹 이름 (예: 1진)"
          editable={!isCreating}
        />
        <Pressable
          style={[styles.smallButton, isCreating && styles.buttonDisabled]}
          onPress={handleCreateGroup}
          disabled={isCreating}
        >
          {isCreating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.smallButtonText}>만들기</Text>}
        </Pressable>
      </View>
      {createError && <Text style={styles.error}>{createError}</Text>}

      <Text style={[styles.formLabel, styles.formLabelSpaced]}>그룹 참가</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={inviteCode}
          onChangeText={setInviteCode}
          placeholder="6자리 초대 코드"
          autoCapitalize="characters"
          editable={!isJoining}
        />
        <Pressable
          style={[styles.smallButton, isJoining && styles.buttonDisabled]}
          onPress={handleJoinGroup}
          disabled={isJoining}
        >
          {isJoining ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.smallButtonText}>참가</Text>}
        </Pressable>
      </View>
      {joinError && <Text style={styles.error}>{joinError}</Text>}
      {joinSuccess && <Text style={styles.success}>그룹에 참가했어요.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  groupList: {
    marginBottom: spacing.lg,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  groupInfo: {
    flexShrink: 1,
  },
  groupName: {
    ...typography.bodyBold,
    color: colors.navy,
  },
  codeRow: {
    marginTop: 2,
  },
  codeText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  leaveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  leaveButtonText: {
    ...typography.small,
    color: colors.danger,
  },
  formLabel: {
    ...typography.captionBold,
    color: colors.navy,
    marginBottom: spacing.sm - 2,
  },
  formLabelSpaced: {
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
    fontFamily: typography.body.fontFamily,
    fontSize: 15,
    color: colors.textPrimary,
  },
  smallButton: {
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg + 2,
    justifyContent: 'center',
  },
  smallButtonText: {
    ...typography.captionBold,
    color: '#fff',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  error: {
    ...typography.small,
    color: colors.danger,
    marginTop: spacing.sm - 2,
  },
  success: {
    ...typography.small,
    color: colors.success,
    marginTop: spacing.sm - 2,
  },
});
