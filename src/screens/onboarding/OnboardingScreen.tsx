import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { completeOnboarding } from '../../services/usersService';
import { ReminderSchedule, Testament } from '../../types/models';
import { colors, radius, spacing, typography } from '../../constants/theme';
import ReminderScheduleSelector from '../../components/common/ReminderScheduleSelector';

interface IntroSlide {
  emoji: string;
  title: string;
  description: string;
}

const INTRO_SLIDES: IntroSlide[] = [
  {
    emoji: '📖',
    title: 'Bible Road에 오신 걸 환영해요',
    description: '매일 목표 장수를 채우며 성경 66권을 끝까지 통독하는 습관을 만들어요.',
  },
  {
    emoji: '🗺️',
    title: '로드맵으로 진행 상황을 확인해요',
    description: '완독한 책은 남색, 지금 읽는 책은 주황색으로 표시돼요. 한 책을 완독하면 다음 책이 자동으로 열려요.',
  },
  {
    emoji: '🔥',
    title: '매일 읽으면 연속 불꽃이 쌓여요',
    description: '오늘의 목표를 채우면 연속 불꽃이 올라가요. 하루 이틀 못 읽어도 유예가 있어서 바로 끊기지 않아요.',
  },
  {
    emoji: '🏆',
    title: '함께 읽는 사람들과 랭킹으로 겨뤄요',
    description:
      '랭킹에서 회독수와 진행률을 비교하고, 같은 책을 읽는 사람에게 화이팅을 보낼 수 있어요. 누가 나에게 화이팅을 보내면 다음에 앱을 열 때 팝업으로 알려주고, 그 자리에서 바로 답장할 수 있어요.',
  },
  {
    emoji: '🔔',
    title: '깜빡해도 알림으로 챙겨드려요',
    description: '정해둔 시간까지 오늘 목표를 못 채우면 알림이 와요. 시간은 다음 화면에서 고를 수 있어요.',
  },
];

const TESTAMENT_STEP = INTRO_SLIDES.length;
const REMINDER_STEP = INTRO_SLIDES.length + 1;
const TOTAL_STEPS = INTRO_SLIDES.length + 2;

export default function OnboardingScreen() {
  const { userId, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedTestament, setSelectedTestament] = useState<Testament | null>(null);
  const [reminderSchedule, setReminderSchedule] = useState<ReminderSchedule>('evening');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTestamentStep = step === TESTAMENT_STEP;
  const isReminderStep = step === REMINDER_STEP;

  function handleSelectTestament(testament: Testament) {
    setSelectedTestament(testament);
    setStep(REMINDER_STEP);
  }

  async function handleFinish() {
    if (!userId || !selectedTestament || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await completeOnboarding(userId, selectedTestament, reminderSchedule);
      await refreshUser();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      {isTestamentStep ? (
        <View style={styles.content}>
          <Text style={styles.title}>어디서부터 시작할까요?</Text>
          <Text style={styles.subtitle}>
            선택한 성경부터 로드맵 순서가 정해져요. 신약을 고르면 마태복음이 1번으로 시작돼요.
          </Text>

          <Pressable style={[styles.optionButton, styles.optionOT]} onPress={() => handleSelectTestament('OT')}>
            <Text style={styles.optionTitle}>구약부터</Text>
            <Text style={styles.optionDesc}>창세기 1장부터 순서대로</Text>
          </Pressable>

          <Pressable style={[styles.optionButton, styles.optionNT]} onPress={() => handleSelectTestament('NT')}>
            <Text style={styles.optionTitle}>신약부터</Text>
            <Text style={styles.optionDesc}>마태복음 1장부터 순서대로</Text>
          </Pressable>
        </View>
      ) : isReminderStep ? (
        <View style={styles.content}>
          <Text style={styles.title}>알림은 언제 받을까요?</Text>
          <Text style={styles.subtitle}>오늘 목표를 아직 못 채웠으면 고른 시간에 알림을 보내드려요.</Text>

          <View style={styles.reminderSelectorWrap}>
            <ReminderScheduleSelector value={reminderSchedule} onChange={setReminderSchedule} disabled={isSubmitting} />
          </View>

          <Pressable style={styles.nextButton} onPress={handleFinish} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextButtonText}>시작하기</Text>}
          </Pressable>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.emoji}>{INTRO_SLIDES[step].emoji}</Text>
          <Text style={styles.title}>{INTRO_SLIDES[step].title}</Text>
          <Text style={styles.subtitle}>{INTRO_SLIDES[step].description}</Text>

          <Pressable style={styles.nextButton} onPress={() => setStep((s) => s + 1)}>
            <Text style={styles.nextButtonText}>다음</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  dots: {
    position: 'absolute',
    top: spacing.xxl + spacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.orange,
  },
  content: {
    alignItems: 'stretch',
  },
  reminderSelectorWrap: {
    marginBottom: spacing.xxl + spacing.xl,
  },
  emoji: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.navy,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xxl + spacing.sm,
    lineHeight: 20,
  },
  optionButton: {
    borderRadius: radius.lg,
    paddingVertical: spacing.xl - 4,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  optionOT: {
    backgroundColor: colors.navy,
  },
  optionNT: {
    backgroundColor: colors.orange,
  },
  optionTitle: {
    ...typography.h3,
    color: '#fff',
  },
  optionDesc: {
    ...typography.caption,
    color: '#fff',
    marginTop: spacing.xs,
    opacity: 0.85,
  },
  nextButton: {
    backgroundColor: colors.orange,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  nextButtonText: {
    ...typography.h3,
    color: '#fff',
  },
});
