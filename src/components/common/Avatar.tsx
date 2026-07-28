import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../../constants/theme';

interface Props {
  createdAt: number;
  nickname: string;
  size: number;
}

/** HSL을 hex 문자열로 변환한다 (h: 0~360, s/l: 0~100). */
function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => lNorm - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (n: number) =>
    Math.round(f(n) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(0)}${toHex(8)}${toHex(4)}`;
}

/** 가입 시각(createdAt)을 색상(hue)으로 삼아 파스텔톤 배경색을 만든다. 사람마다 고유하고 항상 같은 색이 나온다. */
function pastelColorFromCreatedAt(createdAt: number): string {
  const hue = createdAt % 360;
  return hslToHex(hue, 55, 82);
}

/** 가입 시각 기반 파스텔톤 배경 위에 닉네임 첫 글자를 표시한다. */
export default function Avatar({ createdAt, nickname, size }: Props) {
  const containerStyle = { width: size, height: size, borderRadius: size / 2 };
  const backgroundColor = pastelColorFromCreatedAt(createdAt);

  return (
    <View style={[styles.container, containerStyle, { backgroundColor }]}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{nickname.slice(0, 1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.h2,
    color: colors.navy,
  },
});
