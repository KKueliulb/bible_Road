import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../../constants/theme';

interface Props {
  photoURL: string | null;
  nickname: string;
  size: number;
}

/** 프로필 사진이 있으면 이미지로, 없으면(또는 로드 실패 시) 닉네임 첫 글자 아바타로 표시한다. */
export default function Avatar({ photoURL, nickname, size }: Props) {
  const [loadFailed, setLoadFailed] = useState(false);
  // photoURL이 바뀌면(새 사진 업로드 등) 이전 URL에서의 로드 실패 상태를 지우고 새로 시도한다.
  useEffect(() => {
    setLoadFailed(false);
  }, [photoURL]);

  const containerStyle = { width: size, height: size, borderRadius: size / 2 };

  if (photoURL && !loadFailed) {
    return (
      <Image
        source={{ uri: photoURL }}
        style={[styles.image, containerStyle]}
        onError={() => setLoadFailed(true)}
      />
    );
  }

  return (
    <View style={[styles.fallback, containerStyle]}>
      <Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>{nickname.slice(0, 1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surface,
  },
  fallback: {
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    ...typography.h2,
    color: '#fff',
  },
});
