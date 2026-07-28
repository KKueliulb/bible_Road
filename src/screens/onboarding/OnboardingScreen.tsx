import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { completeOnboarding } from '../../services/usersService';
import { Testament } from '../../types/models';
import { colors } from '../../constants/theme';

export default function OnboardingScreen() {
  const { userId, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState<Testament | null>(null);

  async function handleSelect(testament: Testament) {
    if (!userId || isSubmitting) return;
    setIsSubmitting(testament);
    try {
      await completeOnboarding(userId, testament);
      await refreshUser();
    } finally {
      setIsSubmitting(null);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>어디서부터 시작할까요?</Text>
      <Text style={styles.subtitle}>
        선택한 성경부터 로드맵 순서가 정해져요. 신약을 고르면 마태복음이 1번으로 시작돼요.
      </Text>

      <Pressable
        style={[styles.optionButton, styles.optionOT]}
        onPress={() => handleSelect('OT')}
        disabled={isSubmitting !== null}
      >
        {isSubmitting === 'OT' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.optionTitle}>구약부터</Text>
            <Text style={styles.optionDesc}>창세기 1장부터 순서대로</Text>
          </>
        )}
      </Pressable>

      <Pressable
        style={[styles.optionButton, styles.optionNT]}
        onPress={() => handleSelect('NT')}
        disabled={isSubmitting !== null}
      >
        {isSubmitting === 'NT' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.optionTitle}>신약부터</Text>
            <Text style={styles.optionDesc}>마태복음 1장부터 순서대로</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.navy,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 40,
    lineHeight: 20,
  },
  optionButton: {
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  optionOT: {
    backgroundColor: colors.navy,
  },
  optionNT: {
    backgroundColor: colors.orange,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  optionDesc: {
    fontSize: 13,
    color: '#fff',
    marginTop: 4,
    opacity: 0.85,
  },
});
