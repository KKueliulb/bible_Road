# 성경 통독 앱 (bible_Road)

교회 청년부 대상 성경 통독 습관 앱. Expo(React Native) + Firebase(Firestore/FCM) 기반.

> 개발은 설계 문서의 11단계 로드맵을 단계별로 나눠 진행합니다. 현재 완료된 범위: **1~4단계 (프로젝트 셋업 / 정적 데이터 시딩 / 인증 / 홈 로드맵)**.

## 시작하기

```bash
npm install
cp .env.example .env   # Firebase 설정값을 채워 넣으세요 (아래 참고)
npm start
```

`npm start` 실행 후 터미널에 뜨는 QR코드를 Expo Go 앱으로 스캔하거나 `a`(Android) / `i`(iOS) / `w`(Web) 키로 각 플랫폼에서 실행합니다.

## Firebase 설정

1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트를 생성합니다.
2. Firestore Database를 생성합니다 (테스트 모드로 시작 가능).
3. 프로젝트 설정 > 일반 탭에서 웹 앱을 추가하고 나오는 설정값을 `.env` 파일에 채워 넣습니다.

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

`.env`는 git에 커밋되지 않습니다 (`.gitignore` 처리됨).

## 66권 books 데이터 시딩

`books` 컬렉션(구약 39권 + 신약 27권, 총 1,189장)을 Firestore에 채워 넣으려면:

1. Firebase 콘솔 > 프로젝트 설정 > 서비스 계정 탭에서 "새 비공개 키 생성"으로 서비스 계정 JSON을 발급받습니다.
2. 저장소 루트에 `serviceAccountKey.json`으로 저장합니다 (git에 커밋되지 않습니다).
3. 아래 명령을 실행합니다.

```bash
npm run seed:books
```

## 인증 방식

이 앱은 Firebase Auth 대신 **커스텀 로그인**을 사용합니다.

- 회원가입: 본명 + 닉네임만 입력 (비밀번호 없음). 닉네임은 전체 유일값으로 중복 가입이 불가능합니다.
- 로그인: 닉네임으로 기존 계정을 조회합니다.
- 세션은 기기 로컬(AsyncStorage)에 저장되어 앱을 재실행해도 자동 로그인됩니다.

## 프로젝트 구조

```
src/
  App.tsx                    # 엔트리 컴포넌트 (Provider 조합)
  navigation/                # RootNavigator, AuthStack, MainTabs, RoadmapStack
  screens/
    auth/                    # LoginScreen, SignupScreen
    roadmap/                 # RoadmapScreen (홈 로드맵)
    reading/                 # ReadingPlaceholderScreen (5단계에서 실제 구현 예정)
    placeholder/             # 다음 단계에서 채워질 화면 자리표시자
  components/roadmap/         # TestamentDropdown, RoadmapNode, ParticipantListInline
  context/AuthContext.tsx    # 로그인 상태, 세션 복원
  services/
    firebase.ts              # Firebase 초기화
    usersService.ts          # users 컬렉션 CRUD
    booksService.ts           # books 컬렉션 조회 (구약/신약 필터)
    bookProgressService.ts    # users/{userId}/bookProgress 조회
    participantsService.ts    # bookParticipants/{bookId}/members 조회/등록
  data/books.ts               # 66권 정적 데이터
  scripts/seedBooks.ts         # books 컬렉션 시딩 스크립트 (firebase-admin)
  types/models.ts              # Firestore 데이터 모델 타입
  constants/theme.ts            # 색상 등 최소 디자인 토큰 (폴리싱은 이후 단계)
```

## 홈 로드맵 (4단계)

- 구약/신약 드롭다운으로 전환하면 해당 테스타먼트의 책들이 지그재그 노드로 표시됩니다.
- 노드 색상으로 완독/진행중/미시작 상태를 구분합니다. 진행 상태는 `users/{userId}/bookProgress` 문서(없으면 미시작, `currentBookId`와 같으면 진행중)로 판단합니다.
- 진행중인 책 노드 아래에는 함께 읽는 참여자 목록이 인라인으로 표시됩니다.
- 노드를 누르면 `bookParticipants/{bookId}/members/{userId}`에 자동으로 참여 등록되고, 읽기 화면(현재는 placeholder)으로 이동합니다.

## 다음 단계

읽기 화면(5단계: 체크리스트, 읽었어요/N장 더 읽었어요, 밀린 장수 계산)부터 이어서 진행 예정입니다. 자세한 로드맵은 설계 문서를 참고하세요.
