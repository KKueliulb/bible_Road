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
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { changeNickname, updateUser } from '../../services/usersService';
import { uploadProfilePhoto } from '../../services/profilePhotoService';
import { computeLiveOverdueChapters, computeLiveStreakDays } from '../../services/readingService';
import { NICKNAME_CHANGE_LIMIT } from '../../constants/profileConfig';
import Avatar from '../../components/common/Avatar';
import { colors, radius, spacing, typography } from '../../constants/theme';

export default function MyPageScreen() {
  const { userId, user, logout, refreshUser } = useAuth();
  const [newNickname, setNewNickname] = useState('');
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [nicknameSuccess, setNicknameSuccess] = useState(false);
  const [isChangingNickname, setIsChangingNickname] = useState(false);
  const [isChangingPhoto, setIsChangingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  if (!userId || !user) {
    return <ActivityIndicator color={colors.navy} style={styles.spinner} />;
  }

  const liveOverdueChapters = computeLiveOverdueChapters(user);
  const remainingNicknameChanges = Math.max(0, NICKNAME_CHANGE_LIMIT - user.nicknameChangeCount);

  async function handleChangePhoto() {
    if (!userId || isChangingPhoto) return;
    setPhotoError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhotoError('사진 라이브러리 접근 권한이 필요해요.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;

    setIsChangingPhoto(true);
    try {
      const photoURL = await uploadProfilePhoto(userId, result.assets[0].uri);
      await updateUser(userId, { photoURL });
      await refreshUser();
    } catch (error) {
      console.error('프로필 사진 업로드 실패:', error);
      const detail = error instanceof Error ? error.message : String(error);
      setPhotoError(`프로필 사진 업로드에 실패했어요. (${detail})`);
    } finally {
      setIsChangingPhoto(false);
    }
  }

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

  function handleLogout() {
    Alert.alert('로그아웃', '로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => logout() },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.avatarWrap} onPress={handleChangePhoto} disabled={isChangingPhoto}>
        <Avatar photoURL={user.photoURL} nickname={user.nickname} size={80} />
        <View style={styles.avatarEditBadge}>
          {isChangingPhoto ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.avatarEditBadgeText}>변경</Text>
          )}
        </View>
      </Pressable>
      {photoError && <Text style={styles.error}>{photoError}</Text>}
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.nickname}>@{user.nickname}</Text>

      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>전체 진행률</Text>
          <Text style={styles.statValue}>{user.totalProgressPercent.toFixed(1)}%</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>연속 읽기</Text>
          <Text style={styles.statValue}>{computeLiveStreakDays(user)}일</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>밀린 장수</Text>
          <Text style={styles.statValue}>{liveOverdueChapters}장</Text>
        </View>
        <View style={[styles.statRow, styles.statRowLast]}>
          <Text style={styles.statLabel}>회독</Text>
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
  avatarWrap: {
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    minWidth: 36,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarEditBadgeText: {
    ...typography.smallBold,
    color: '#fff',
    fontSize: 11,
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
  logoutButton: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    paddingVertical: spacing.md,
  },
  logoutButtonText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
