import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ReminderSchedule } from '../../types/models';
import { colors, radius, spacing, typography } from '../../constants/theme';

const OPTIONS: { value: ReminderSchedule; label: string }[] = [
  { value: 'morning', label: '아침 8시' },
  { value: 'evening', label: '저녁 8시' },
  { value: 'both', label: '모두' },
];

interface Props {
  value: ReminderSchedule;
  onChange: (value: ReminderSchedule) => void;
  disabled?: boolean;
}

export default function ReminderScheduleSelector({ value, onChange, disabled }: Props) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={[styles.option, selected && styles.optionSelected]}
            onPress={() => onChange(option.value)}
            disabled={disabled}
          >
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  optionSelected: {
    borderColor: colors.navy,
    backgroundColor: colors.navyLight,
  },
  optionText: {
    ...typography.captionBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  optionTextSelected: {
    color: colors.navy,
  },
});
