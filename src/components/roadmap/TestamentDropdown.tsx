import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Testament } from '../../types/models';
import { colors } from '../../constants/theme';

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
    backgroundColor: '#F1F2F4',
    borderRadius: 999,
    padding: 4,
    marginVertical: 12,
  },
  option: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
  },
  optionActive: {
    backgroundColor: colors.navy,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  optionTextActive: {
    color: '#fff',
  },
});
