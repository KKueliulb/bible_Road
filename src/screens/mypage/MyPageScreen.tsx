import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { changeNickname } from '../../services/usersService';
import { computeLiveOverdueChapters, resetUserProgress } from '../../services/readingService';
import { NICKNAME_CHANGE_LIMIT } from '../../constants/profileConfig';
import { colors, radius, spacing, typography } from '../../constants/theme';

export default function MyPageScreen() {
  const { userId, user, logout, refreshUser } = useAuth();
  const [newNickname, setNewNickname] = useState('');
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [nicknameSuccess, setNicknameSuccess] = useState(false);
  const [isChangingNickname, setIsChangingNickname] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!userId || !user) {
    return <ActivityIndicator color={colors.navy} style={styles.spinner} />;
  }

  const liveOverdueChapters = computeLiveOverdueChapters(user);
  const remainingNicknameChanges = Math.max(0, NICKNAME_CHANGE_LIMIT - user.nicknameChangeCount);

  async function handleChangeNickname() {
    if (!userId || !user || isChangingNickname) return;
    setNicknameError(null);
    setNicknameSuccess(false);
    setIsChangingNickname(true);
    try {
      const result = await changeNickname(userId, user.nicknameChangeCount, newNickname);
      if (!result.ok) {
        setNicknameError(result.error);
        return;
      }
      setNewNickname('');
      setNicknameSuccess(true);
      await refreshUser();
    } catch {
      setNicknameError('닉네임 변경에 실패했어요.');
    } finally {
      setIsChangingNickname(false);
    }
  }

  function handleReset() {
    Alert.alert(
      '처음부터 다시 읽기',
      '스트릭을 제외한 모든 진행 상황(진행률, 밀린 장수, 읽고 있던 책)이 초기화돼요. 계속할까요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: async () => {
            if (!userId || !user) return;
            setIsResetting(true);
            try {
              await resetUserProgress(userId, user);
              await refreshUser();
            } catch {
              Alert.alert('초기화에 실패했어요. 다시 시도해주세요.');
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  }

  function handleLogout() {
    Alert.alert('로그아웃', '로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => logout() },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user.nickname.slice(0, 1)}</Text>
      </View>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.nickname}>@{user.nickname}</Text>

      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>전체 진행률</Text>
          <Text style={styles.statValue}>{user.totalProgressPercent.toFixed(1)}%</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>연속 읽기</Text>
          <Text style={styles.statValue}>{user.streakDays}일</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>밀린 장수</Text>
          <Text style={styles.statValue}>{liveOverdueChapters}장</Text>
        </View>
        <View style={[styles.statRow, styles.statRowLast]}>
          <Text style={styles.statLabel}>다시 읽기</Text>
          <Text style={styles.statValue}>{user.rereadCount}회</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>닉네임 변경</Text>
      <Text style={styles.helperText}>
        {remainingNicknameChanges > 0
          ? `앞으로 ${remainingNicknameChanges}번 더 변경할 수 있어요.`
          : '닉네임 변경 가능 횟수를 모두 사용했어요.'}
      </Text>
      <View style={styles.nicknameRow}>
        <TextInput
          style={[styles.input, remainingNicknameChanges === 0 && styles.inputDisabled]}
          value={newNickname}
          onChangeText={setNewNickname}
          placeholder="새 닉네임"
          autoCapitalize="none"
          editable={remainingNicknameChanges > 0 && !isChangingNickname}
        />
        <Pressable
          style={[
            styles.smallButton,
            (remainingNicknameChanges === 0 || isChangingNickname) && styles.buttonDisabled,
          ]}
          onPress={handleChangeNickname}
          disabled={remainingNicknameChanges === 0 || isChangingNickname}
        >
          {isChangingNickname ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.smallButtonText}>변경</Text>
          )}
        </Pressable>
      </View>
      {nicknameError && <Text style={styles.error}>{nicknameError}</Text>}
      {nicknameSuccess && <Text style={styles.success}>닉네임이 변경됐어요.</Text>}

      <Pressable
        style={[styles.dangerButton, isResetting && styles.buttonDisabled]}
        onPress={handleReset}
        disabled={isResetting}
      >
        {isResetting ? (
          <ActivityIndicator color={colors.danger} />
        ) : (
          <Text style={styles.dangerButtonText}>처음부터 다시 읽기 (초기화)</Text>
        )}
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>로그아웃</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
  },
  spinner: {
    marginTop: spacing.xxl + spacing.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.navy,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    ...typography.h2,
    color: '#fff',
  },
  name: {
    ...typography.h2,
    color: colors.navy,
    textAlign: 'center',
  },
  nickname: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statRowLast: {
    borderBottomWidth: 0,
  },
  statLabel: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.bodyBold,
    fontSize: 14,
    color: colors.navy,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  helperText: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.sm + 2,
  },
  nicknameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
    fontFamily: typography.body.fontFamily,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputDisabled: {
    opacity: 0.5,
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
  dangerButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.lg - 2,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  dangerButtonText: {
    ...typography.bodyBold,
    color: colors.danger,
  },
  logoutButton: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  logoutButtonText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
