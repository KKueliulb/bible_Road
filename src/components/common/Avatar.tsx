import React from 'react';
import { StyleSheet, View } from 'react-native';

interface Props {
  createdAt: number;
  size: number;
}

/** 가입 시각(createdAt)을 24비트 값으로 변환한 16진수 색을 배경으로 쓴다. 사람마다 고유하고 항상 같은 색이 나온다. */
function colorFromCreatedAt(createdAt: number): string {
  const hex = (createdAt % 0xffffff).toString(16).padStart(6, '0');
  return `#${hex}`;
}

/** 프로필 사진 대신, 가입 시각 기반 배경색 위에 십자가 아이콘을 표시한다. */
export default function Avatar({ createdAt, size }: Props) {
  const containerStyle = { width: size, height: size, borderRadius: size / 2 };
  const backgroundColor = colorFromCreatedAt(createdAt);

  const verticalBar = {
    width: Math.max(2, size * 0.14),
    height: size * 0.56,
    borderRadius: size * 0.03,
  };
  const horizontalBar = {
    width: size * 0.56,
    height: Math.max(2, size * 0.14),
    borderRadius: size * 0.03,
  };

  return (
    <View style={[styles.container, containerStyle, { backgroundColor }]}>
      <View style={[styles.bar, verticalBar]} />
      <View style={[styles.bar, horizontalBar]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    position: 'absolute',
    backgroundColor: '#fff',
  },
});
