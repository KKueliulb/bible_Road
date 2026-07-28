import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface Props {
  maxAvailable: number;
  isSubmitting: boolean;
  /** 오늘 이미 사용해서 회색으로 비활성화된 상태. 버튼 자체는 사라지지 않는다. */
  alreadyDoneToday: boolean;
  onSubmit: (chapterCount: number) => void;
}

export default function ExtraReadDropdownButton({
  maxAvailable,
  isSubmitting,
  alreadyDoneToday,
  onSubmit,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const disabled = isSubmitting || alreadyDoneToday;

  // 1장부터 밀린 장수(맥시멈)까지 전부 선택 가능 (짝수 포함)
  const options = Array.from({ length: maxAvailable }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.toggle, alreadyDoneToday && styles.toggleDone]}
        onPress={() => setIsOpen((prev) => !prev)}
        disabled={disabled}
      >
        <Text style={[styles.toggleText, alreadyDoneToday && styles.toggleTextDone]}>
          {alreadyDoneToday ? '오늘 사용 완료' : 'N장 더 읽었어요!'}
        </Text>
      </Pressable>

      {isOpen && !disabled && (
        <View style={styles.options}>
          {isSubmitting ? (
            <ActivityIndicator color={colors.navy} />
          ) : (
            options.map((n) => (
              <Pressable
                key={n}
                style={styles.option}
                onPress={() => {
                  setIsOpen(false);
                  onSubmit(n);
                }}
              >
                <Text style={styles.optionText}>{n === maxAvailable ? `전체(${n}장)` : `${n}장`}</Text>
              </Pressable>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  toggle: {
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: radius.md,
    paddingVertical: spacing.lg - 2,
    alignItems: 'center',
  },
  toggleDone: {
    borderColor: colors.border,
  },
  toggleText: {
    ...typography.bodyBold,
    color: colors.navy,
    fontSize: 15,
  },
  toggleTextDone: {
    color: colors.textSecondary,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm,
  },
  optionText: {
    ...typography.captionBold,
    color: colors.textPrimary,
  },
});
