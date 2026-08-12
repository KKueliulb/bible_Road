import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../../constants/theme';

interface Props {
  percent: number;
  color?: string;
}

/** 진척도를 보여주는 얇은 가로 막대 그래프. */
export default function ProgressBar({ percent, color = colors.orange }: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
