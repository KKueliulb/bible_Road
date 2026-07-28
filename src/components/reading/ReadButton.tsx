import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface Props {
  onPress: () => void;
  isSubmitting: boolean;
  /** 오늘 이미 사용해서 회색으로 비활성화된 상태. 버튼 자체는 사라지지 않는다. */
  alreadyDoneToday: boolean;
}

export default function ReadButton({ onPress, isSubmitting, alreadyDoneToday }: Props) {
  const disabled = isSubmitting || alreadyDoneToday;

  return (
    <Pressable
      style={[styles.button, alreadyDoneToday && styles.buttonDone, isSubmitting && styles.buttonSubmitting]}
      onPress={onPress}
      disabled={disabled}
    >
      {isSubmitting ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.text, alreadyDoneToday && styles.textDone]}>
          {alreadyDoneToday ? '오늘 읽음 완료' : '읽었어요!'}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.orange,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.orange,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonDone: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonSubmitting: {
    opacity: 0.6,
  },
  text: {
    ...typography.bodyBold,
    color: '#fff',
    fontSize: 16,
  },
  textDone: {
    color: colors.textSecondary,
  },
});
