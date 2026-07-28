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
import { colors } from '../../constants/theme';

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
    padding: 24,
  },
  spinner: {
    marginTop: 40,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
    textAlign: 'center',
  },
  nickname: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  statsCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statRowLast: {
    borderBottomWidth: 0,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  nicknameRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  smallButton: {
    backgroundColor: colors.navy,
    borderRadius: 8,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
  },
  success: {
    color: colors.navy,
    fontSize: 12,
    marginTop: 6,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 32,
  },
  dangerButtonText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  logoutButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
