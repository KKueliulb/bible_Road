import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';

interface Props {
  label: string;
}

export default function PlaceholderScreen({ label }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label} 화면은 다음 단계에서 만들어집니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  text: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
