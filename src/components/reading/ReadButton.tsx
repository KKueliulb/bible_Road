import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../constants/theme';

interface Props {
  onPress: () => void;
  isSubmitting: boolean;
}

export default function ReadButton({ onPress, isSubmitting }: Props) {
  return (
    <Pressable style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={onPress} disabled={isSubmitting}>
      {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>읽었어요!</Text>}
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
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
