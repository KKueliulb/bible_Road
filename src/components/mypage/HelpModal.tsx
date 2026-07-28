import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: '연속 불꽃은 어떻게 쌓이나요?',
    answer:
      '매일 "읽었어요!"를 눌러 오늘 목표를 채우면 연속 불꽃이 1씩 올라가요. 유예 기간(최대 2일) 안에는 하루 이틀 건너뛰어도 연속 불꽃이 끊기지 않아요.',
  },
  {
    question: '밀린 장수는 뭐고 어떻게 없애나요?',
    answer: '유예 기간을 넘겨서 확정된 공백이에요. 밀린 장수가 있을 때만 나타나는 "N장 더 읽었어요!" 버튼으로 갚을 수 있어요.',
  },
  {
    question: '회독은 뭔가요?',
    answer: '66권을 모두 완독하면 자동으로 처음 책으로 돌아가고 회독수가 1 올라가요. 연속 불꽃은 그대로 이어져요.',
  },
  {
    question: '화이팅 버튼은 뭔가요?',
    answer: '같은 책을 읽고 있는 사람에게 하루 한 번 응원을 보낼 수 있어요.',
  },
  {
    question: '알림은 언제 오나요?',
    answer: '저녁 8시까지 그날 목표를 못 채우면 알림이 와요.',
  },
  {
    question: '로드맵 노드 순서는 어떻게 정해지나요?',
    answer: '온보딩에서 고른 시작 성경(구약/신약)에 따라 정해지고, 책을 완독하면 다음 책이 자동으로 열려요.',
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function HelpModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>도움말</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.closeText}>닫기</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {FAQ_ITEMS.map((item) => (
            <View key={item.question} style={styles.item}>
              <Text style={styles.question}>Q. {item.question}</Text>
              <Text style={styles.answer}>{item.answer}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.navy,
  },
  closeText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  content: {
    padding: spacing.xl,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  question: {
    ...typography.bodyBold,
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  answer: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
