// 폰트: 나눔스퀘어라운드(Regular/Bold). App.tsx에서 useFonts로 로드하고, 로드 전에는
// 시스템 기본 폰트로 표시되다가 로드가 끝나면 아래 이름으로 렌더링됩니다.
export const fonts = {
  regular: 'NanumSquareRoundR',
  bold: 'NanumSquareRoundB',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const colors = {
  navy: '#1B2A4A',
  navyLight: '#EEF1F7',
  orange: '#F5822B',
  orangeLight: '#FFF1E6',
  background: '#FFFFFF',
  surface: '#F8F9FB',
  textPrimary: '#1B2A4A',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  danger: '#DC2626',
  dangerLight: '#FDECEC',
  success: '#1F9254',
  successLight: '#E8F7EE',
};

// 로드맵 노드 원 배경에 쓰는 그라데이션(진행중=오렌지, 완독=네이비). 튜플 타입이라야 LinearGradient의
// colors prop(최소 2개 필요)과 타입이 맞는다.
export const gradients: { orange: [string, string]; navy: [string, string] } = {
  orange: ['#FFAE6B', '#F5822B'],
  navy: ['#3A4E75', '#1B2A4A'],
};

// 자주 쓰는 텍스트 스타일 프리셋. fontWeight 대신 폰트 패밀리(Regular/Bold)로 굵기를 표현합니다
// (커스텀 폰트에 fontWeight를 같이 주면 일부 기기에서 가짜 볼드가 겹쳐 보일 수 있어서).
export const typography = {
  h1: { fontFamily: fonts.bold, fontSize: 26 },
  h2: { fontFamily: fonts.bold, fontSize: 20 },
  h3: { fontFamily: fonts.bold, fontSize: 16 },
  body: { fontFamily: fonts.regular, fontSize: 15 },
  bodyBold: { fontFamily: fonts.bold, fontSize: 15 },
  caption: { fontFamily: fonts.regular, fontSize: 13 },
  captionBold: { fontFamily: fonts.bold, fontSize: 13 },
  small: { fontFamily: fonts.regular, fontSize: 12 },
  smallBold: { fontFamily: fonts.bold, fontSize: 12 },
};
