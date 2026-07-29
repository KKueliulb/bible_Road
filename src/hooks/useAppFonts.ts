import { useFonts } from 'expo-font';

export function useAppFonts() {
  return useFonts({
    NanumSquareRoundR: require('../../assets/fonts/NanumSquareRoundR.ttf'),
    NanumSquareRoundB: require('../../assets/fonts/NanumSquareRoundB.ttf'),
  });
}
