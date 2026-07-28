# 성경 통독 앱 (bible_Road)

교회 청년부 대상 성경 통독 습관 앱. Expo(React Native) + Firebase(Firestore/FCM) 기반.

> 개발은 설계 문서의 11단계 로드맵을 단계별로 나눠 진행합니다. 현재 완료된 범위: **1~5단계 (프로젝트 셋업 / 정적 데이터 시딩 / 인증 / 홈 로드맵 / 읽기 화면)**.

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

## 가입된 유저 초기화 (베타 테스트용)

`users` + 각 유저의 `bookProgress` + `bookParticipants`(참여 기록) + `cheerLogs`(화이팅 기록)를 전부 삭제합니다. `books` 컬렉션은 건드리지 않습니다.

⚠️ **되돌릴 수 없습니다.** serviceAccountKey.json은 `seed:books`와 동일하게 준비되어 있어야 합니다.

```bash
npm run reset:users
```

## 인증 방식

이 앱은 Firebase Auth 대신 **커스텀 로그인**을 사용합니다.

- 회원가입: 본명 + 닉네임만 입력 (비밀번호 없음). 닉네임은 전체 유일값으로 중복 가입이 불가능합니다.
- 로그인: 닉네임으로 기존 계정을 조회합니다.
- 세션은 기기 로컬(AsyncStorage)에 저장되어 앱을 재실행해도 자동 로그인됩니다.

## 개발 중 빠르게 테스트하기

회원가입 화면 맨 아래 **"🧪 테스트 계정으로 바로 시작"** 버튼은 개발 빌드(`__DEV__`)에서만 보입니다. 누르면 고정 닉네임(`테스트유저`)으로 로그인하고, 계정이 없으면 자동으로 만들어줍니다. 매번 폼을 채우지 않고 바로 로드맵/읽기 화면 등을 확인할 수 있습니다. 프로덕션 빌드에서는 자동으로 사라집니다.

## 프로젝트 구조

```
src/
  App.tsx                    # 엔트리 컴포넌트 (Provider 조합)
  navigation/                # RootNavigator, AuthStack, MainTabs, RoadmapStack
  screens/
    auth/                    # LoginScreen, SignupScreen
    roadmap/                 # RoadmapScreen (홈 로드맵)
    reading/                 # ReadingScreen (체크리스트, 읽었어요 등)
    placeholder/             # 다음 단계에서 채워질 화면 자리표시자
  components/
    roadmap/                 # TestamentDropdown, RoadmapNode, ParticipantListInline
    reading/                 # ChapterChecklist, TodayGoalCard, StreakWarningBanner, ReadButton, ExtraReadDropdownButton, MemberProgressList
  context/AuthContext.tsx    # 로그인 상태, 세션 복원, refreshUser
  services/
    firebase.ts              # Firebase 초기화
    usersService.ts          # users 컬렉션 CRUD
    booksService.ts           # books 컬렉션 조회 (구약/신약 필터, id로 단건 조회)
    bookProgressService.ts    # users/{userId}/bookProgress 조회/저장
    participantsService.ts    # bookParticipants/{bookId}/members 조회/등록
    cheerLogsService.ts        # 화이팅 하루 1회 제한 체크 + 전송
    readingService.ts          # "읽었어요/N장 더 읽었어요" 핵심 로직 (아래 참고)
  data/books.ts               # 66권 정적 데이터
  scripts/seedBooks.ts         # books 컬렉션 시딩 스크립트 (firebase-admin)
  types/models.ts              # Firestore 데이터 모델 타입
  constants/
    theme.ts                   # 색상 등 최소 디자인 토큰 (폴리싱은 이후 단계)
    readingConfig.ts            # DAILY_CHAPTER_GOAL (하루 기본 목표 장수, 여기서 조정)
```

## 홈 로드맵 (4단계)

- 구약/신약 드롭다운으로 전환하면 해당 테스타먼트의 책들이 지그재그 노드로 표시됩니다.
- 노드 색상으로 완독/진행중/미시작 상태를 구분합니다. 진행 상태는 `users/{userId}/bookProgress` 문서(없으면 미시작, `currentBookId`와 같으면 진행중)로 판단합니다.
- 진행중인 책 노드 아래에는 함께 읽는 참여자 목록이 **실시간(onSnapshot)**으로 표시됩니다.
- 모든 노드에 참여인원 수 + 전체 장수가 항상 표시됩니다(진입 가능 여부와 무관).
- **미시작(not_started) 상태인 책은 눌러도 들어갈 수 없습니다** — 안내 메시지만 뜨고 읽기 화면으로 이동하지 않습니다. 진행중/완독 상태인 책만 진입 가능합니다.
- 진입 가능한 노드를 누르면 `bookParticipants/{bookId}/members/{userId}`에 자동으로 참여 등록되고, 읽기 화면으로 이동합니다.
- 책을 완독하면 그 책이 `currentBookId`였을 경우 자동으로 다음 책(정경 순서상 다음)으로 `currentBookId`/`currentTestament`가 이동합니다. (이게 없으면 완독해도 다음 책이 계속 잠겨 있게 됩니다.)

## 읽기 화면 (5단계)

설계 문서에 스트릭/유예/밀린 장수의 정확한 계산식이 없어서, 아래 규칙으로 직접 정의했습니다. 필요하면 `src/services/readingService.ts`와 `src/constants/readingConfig.ts`를 수정하세요.

- **하루 목표 장수**: `src/constants/readingConfig.ts`의 `DAILY_CHAPTER_GOAL`(기본 5장) 하나로 관리. 숫자만 바꾸면 전체 로직에 반영됩니다.
- **읽었어요!**: 오늘 아직 아무 책도 안 읽었으면 보입니다. 누르면 `DAILY_CHAPTER_GOAL`만큼 진행 + 스트릭 갱신.
- **N장 더 읽었어요!**: "오늘 읽었는지"와는 무관하게, **밀린 장수(overdueChapters)가 0보다 클 때만** 나타나는 별도 버튼입니다. 즉 가입 첫날에는 아직 밀린 게 없으니 뜨지 않고, 하루 이상 안 읽어서 밀린 장수가 생겨야 활성화됩니다. 선택 가능한 장수도 밀린 장수만큼으로 제한됩니다(`min(overdueChapters, 책에 남은 장수)`). "읽었어요!"와 동시에 보일 수 있습니다(오늘 목표 + 밀린 것 둘 다 있을 때).
- **스트릭/유예(streakDays/graceDaysLeft)**: 책 단위가 아니라 유저 전역 기준. 어제 이어서 읽으면 연속 기록 +1, 하루 이상 건너뛰면 남은 유예일로 커버를 시도하고, 유예를 초과하면 스트릭이 1로 리셋됩니다. 9단계(Cloud Functions)에서 매일 자정 서버 로직으로 보완할 예정이라, 지금은 "읽었어요"를 누르는 시점에만 클라이언트에서 계산합니다.
- **밀린 장수(overdueChapters)**: `max(0, 가입일 이후 "완전히 지난 날" 수 × DAILY_CHAPTER_GOAL − 지금까지 읽은 전체 장수)`로 계산합니다. 가입 당일은 아직 하루가 안 지났으므로 항상 0입니다(오늘 목표를 아직 안 채웠다고 밀린 걸로 치지 않음).
- 화이팅 버튼은 `cheerLogs/{fromUserId_toUserId_date}` 문서 존재 여부로 하루 1회 제한을 클라이언트에서 체크합니다. 실제 푸시 알림(FCM)은 9단계에서 Cloud Functions로 붙일 예정입니다.

### 개발 중 테스트하기 (2번: 책 잠금 / 3번: 밀린 장수)

- **책 잠금 확인**: 로그인 후 홈 로드맵에서 진행중이 아닌(미시작) 책 노드를 눌러보세요. 안내 메시지만 뜨고 들어가지지 않으면 정상입니다. 참여인원/전체 장수는 그 노드에도 그대로 표시됩니다.
- **밀린 장수(N장 더 읽었어요) 확인**: 24시간을 기다리지 않아도 되도록, 읽기 화면 체크리스트 아래에 개발 빌드에서만 보이는 **"🕐 [개발용] 어제 안 읽은 것으로 시뮬레이션"** 버튼을 추가했습니다. 누르면 `lastReadAt`을 이틀 전으로, `overdueChapters`를 `DAILY_CHAPTER_GOAL`만큼 강제로 설정합니다. 누른 뒤 "N장 더 읽었어요!" 버튼이 나타나는지 확인하면 됩니다.

## 다음 단계

랭킹/마이페이지(6~7단계)부터 이어서 진행 예정입니다. 자세한 로드맵은 설계 문서를 참고하세요.
