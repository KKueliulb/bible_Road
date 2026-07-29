import { useFonts } from 'expo-font';

// woff2는 같은 TTF를 무손실 변환한 것(글자셋 동일, 용량만 ~1MB → ~240KB로 축소).
export function useAppFonts() {
  return useFonts({
    NanumSquareRoundR: require('../../assets/fonts/NanumSquareRoundR.woff2'),
    NanumSquareRoundB: require('../../assets/fonts/NanumSquareRoundB.woff2'),
  });
}
