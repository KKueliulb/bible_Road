import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../constants/theme';

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
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.orange,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDone: {
    backgroundColor: colors.border,
  },
  buttonSubmitting: {
    opacity: 0.6,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  textDone: {
    color: colors.textSecondary,
  },
});
