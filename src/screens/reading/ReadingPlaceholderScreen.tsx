import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RoadmapStackParamList } from '../../navigation/RoadmapStack';
import { colors } from '../../constants/theme';

type Props = NativeStackScreenProps<RoadmapStackParamList, 'Reading'>;

export default function ReadingPlaceholderScreen({ route }: Props) {
  const { bookName } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{bookName}</Text>
      <Text style={styles.text}>읽기 화면(체크리스트, 읽었어요 버튼 등)은 다음 단계에서 만들어집니다.</Text>
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
