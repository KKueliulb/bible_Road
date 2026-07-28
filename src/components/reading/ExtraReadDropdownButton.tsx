import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';

interface Props {
  maxAvailable: number;
  isSubmitting: boolean;
  onSubmit: (chapterCount: number) => void;
}

const QUICK_OPTIONS = [1, 3, 5, 10];

export default function ExtraReadDropdownButton({ maxAvailable, isSubmitting, onSubmit }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const options = QUICK_OPTIONS.filter((n) => n < maxAvailable);
  options.push(maxAvailable);

  return (
    <View style={styles.container}>
      <Pressable style={styles.toggle} onPress={() => setIsOpen((prev) => !prev)} disabled={isSubmitting}>
        <Text style={styles.toggleText}>N장 더 읽었어요!</Text>
      </Pressable>

      {isOpen && (
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
    marginHorizontal: 16,
    marginTop: 12,
  },
  toggle: {
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  toggleText: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '700',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  optionText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
