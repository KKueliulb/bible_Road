import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Testament } from '../../types/models';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface Props {
  value: Testament;
  onChange: (testament: Testament) => void;
}

const OPTIONS: { value: Testament; label: string }[] = [
  { value: 'OT', label: '구약' },
  { value: 'NT', label: '신약' },
];

export default function TestamentDropdown({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.option, isActive && styles.optionActive]}
          >
            <Text style={[styles.optionText, isActive && styles.optionTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: spacing.xs,
    marginVertical: spacing.md,
  },
  option: {
    paddingHorizontal: spacing.xl - 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  optionActive: {
    backgroundColor: colors.navy,
  },
  optionText: {
    ...typography.bodyBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  optionTextActive: {
    color: '#fff',
  },
});
