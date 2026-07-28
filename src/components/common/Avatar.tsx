import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, typography } from '../../constants/theme';

interface Props {
  nickname: string;
  size: number;
}

/** 남색 그라데이션 배경 위에 닉네임 첫 글자를 표시한다. */
export default function Avatar({ nickname, size }: Props) {
  const containerStyle = { width: size, height: size, borderRadius: size / 2 };

  return (
    <LinearGradient
      colors={gradients.navy}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, containerStyle]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{nickname.slice(0, 1)}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.h2,
    color: '#fff',
  },
});
