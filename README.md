# 성경 통독 앱 (bible_Road)

교회 청년부 대상 성경 통독 습관 앱. Expo(React Native) + Firebase(Firestore/FCM) 기반.

> 개발은 설계 문서의 11단계 로드맵을 단계별로 나눠 진행합니다. 현재 완료된 범위: **1~8단계 + 10단계 일부 (프로젝트 셋업 / 정적 데이터 시딩 / 인증 / 홈 로드맵 / 읽기 화면 / 랭킹 / 마이페이지 / 온보딩 / 디자인 폴리싱)**. 9단계(Cloud Functions·푸시 알림)는 아직입니다.

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
3. **Storage**도 생성합니다(테스트 모드로 시작 가능) — 프로필 사진 업로드에 사용됩니다. 생성하지 않으면 마이페이지의 "프로필 사진 변경"이 실패합니다.
4. 프로젝트 설정 > 일반 탭에서 웹 앱을 추가하고 나오는 설정값을 `.env` 파일에 채워 넣습니다.

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

- 회원가입: 본명 + 닉네임만 입력 (비밀번호 없음). 닉네임은 전체 유일값으로 중복 가입이 불가능합니다. **가입 완료 후 자동 로그인되지 않고, 로그인 화면으로 이동해서(닉네임이 미리 채워진 상태) 다시 로그인해야 홈으로 들어갑니다.**
- 로그인: 닉네임으로 기존 계정을 조회합니다.
- 세션은 기기 로컬(AsyncStorage)에 저장되어 앱을 재실행해도 자동 로그인됩니다(한 번 로그인한 뒤부터는 유지됨).

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
    ranking/                 # RankingScreen (전체 진행률 랭킹)
    mypage/                  # MyPageScreen (통계/닉네임 변경/초기화/로그아웃)
    onboarding/              # OnboardingScreen (구약/신약 시작 선택)
  components/
    common/                  # Avatar (프로필 사진 또는 닉네임 이니셜 폴백)
    roadmap/                 # HomeTopBar, TodayGoalFloatingBar, TestamentDropdown, RoadmapNode(그라데이션+병합된 참여자 카드 포함), RoadmapConnector
    reading/                 # ChapterChecklist, TodayGoalCard, StreakWarningBanner, ReadButton, ExtraReadDropdownButton, MemberProgressList
    ranking/                 # RankingPodium(TOP 3 단상), RankingListRow, ProgressBar
  context/AuthContext.tsx    # 로그인 상태, 세션 복원, refreshUser
  services/
    firebase.ts              # Firebase 초기화 (Firestore + Storage)
    usersService.ts          # users 컬렉션 CRUD, 랭킹 구독, 닉네임 변경, 온보딩 완료 처리
    profilePhotoService.ts    # 프로필 사진을 Firebase Storage에 업로드
    booksService.ts           # books 컬렉션 조회 (구약/신약 필터, id로 단건 조회)
    bookProgressService.ts    # users/{userId}/bookProgress 조회/저장/전체삭제
    participantsService.ts    # bookParticipants/{bookId}/members 조회/등록/삭제
    cheerLogsService.ts        # 화이팅 하루 1회 제한 체크 + 전송
    readingService.ts          # "읽었어요/N장 더 읽었어요" 핵심 로직 + 66권 완독 시 자동 회독 처리 (아래 참고)
  data/books.ts               # 66권 정적 데이터 + 개인화된 진행 순서 계산(getPersonalizedSequence)
  scripts/
    seedBooks.ts               # books 컬렉션 시딩 스크립트 (firebase-admin)
    seedTestRanking.ts          # 랭킹 화면 테스트용 더미 유저 55명 생성 스크립트 (firebase-admin)
    resetUsers.ts               # 전체 유저 + 관련 데이터 삭제 스크립트 (firebase-admin)
  types/models.ts              # Firestore 데이터 모델 타입
  constants/
    theme.ts                   # 폰트/spacing/radius/색상/타이포그래피 디자인 토큰 (아래 "디자인 폴리싱" 참고)
    readingConfig.ts            # DAILY_CHAPTER_GOAL (하루 기본 목표 장수, 여기서 조정)
    profileConfig.ts             # NICKNAME_CHANGE_LIMIT (닉네임 변경 가능 횟수, 여기서 조정)
assets/fonts/                    # 나눔스퀘어라운드 Regular/Bold TTF (OFL-1.1, LICENSE.txt 참고)
```

## 홈 로드맵 (4단계)

- **상단바(고정)**: 왼쪽 🔥 연속 읽기 일수, 가운데 📖 회독수(`rereadCount`), 오른쪽 닉네임. 네이티브 헤더(`로드맵` 타이틀) 대신 `HomeTopBar` 컴포넌트로 직접 그립니다(`RoadmapStack`에서 `RoadmapHome`은 `headerShown: false`).
- **"오늘의 목표" 플로팅 바(고정)**: 현재 진행중인 책 기준 오늘 읽을 장수 범위를 보여주고, 오늘 "읽었어요!"를 이미 눌렀으면 체크 배지로 바뀝니다. 로드맵 목록을 스크롤해도 상단바 바로 아래 계속 고정됩니다(스크롤 영역 바깥에 배치).
  - **표시 구간은 24시간 동안 고정됩니다**(`computeTodayGoalRange`). "읽었어요!"를 누르는 순간 화면이 곧바로 다음 구간으로 넘어가 버려서 마치 오늘 목표를 아직 못 채운 것처럼 보이던 문제를 고쳤습니다 — 오늘 이미 읽었으면 다음 날이 되기 전까지는 방금 끝낸 구간 + 체크 표시를 그대로 보여줍니다. 읽기 화면의 "오늘의 목표" 카드도 동일하게 동작합니다.
- 구약/신약 드롭다운으로 전환하면 해당 테스타먼트의 책들이 지그재그 노드로 표시되고, 노드 사이는 `react-native-svg` `Path`로 그린 S자 곡선 점선(`RoadmapConnector`)으로 연결됩니다.
- **노드는 한 화면에 약 3권 정도만 보이는 크기로 표시**되고, 원 안에 책 이름 + 읽은 장수/전체 장수를 직접 표시합니다.
- 노드 색상으로 완독/진행중/미시작 상태를 구분합니다(완독=네이비 그라데이션, 진행중=오렌지 그라데이션, 미시작=흰색 플랫). `expo-linear-gradient`로 그립니다. 진행 상태는 `users/{userId}/bookProgress` 문서(없으면 미시작, `currentBookId`와 같으면 진행중)로 판단합니다. **완독한 노드는 이름/장수 아래에 "완독" 텍스트가 표시됩니다**(체크마크 오버레이는 제거).
- **참여인원 정보는 노드 옆(정렬 방향 그대로, 노드 다음 자리)에 표시**됩니다. 진행중인 노드는 참여인원 수 + 실시간 닉네임 목록이 하나의 카드로 합쳐져 표시되고, 그 외 노드는 참여인원 수만 표시됩니다. 모든 책의 참여인원 수는 각자 실시간(onSnapshot)으로 구독되어, 다른 사람이 참여/이탈하면 바로 반영됩니다.
- **미시작(not_started)·완독(completed) 상태인 책은 눌러도 들어갈 수 없습니다** — 안내 메시지만 뜨고 읽기 화면으로 이동하지 않습니다. 진행중(in_progress) 상태인 책만 진입 가능합니다.
- 진입 가능한 노드를 누르면 `bookParticipants/{bookId}/members/{userId}`에 자동으로 참여 등록되고, 읽기 화면으로 이동합니다.
- 책을 완독하면 그 책이 `currentBookId`였을 경우 자동으로 다음 책(정경 순서상 다음)으로 `currentBookId`/`currentTestament`가 이동합니다. 이때 **완독한 책의 참여기록은 제거되고 새 책에만 등록**됩니다 — 참여인원/이름 목록은 항상 "지금 그 책을 읽고 있는 사람"만 정확히 반영하며, 실시간 구독(onSnapshot) 덕분에 다른 사람 화면에도 즉시 반영됩니다.
- 로드맵 화면은 포커스를 받을 때마다(읽기 화면에서 돌아올 때 등) 진행 상태(`bookProgress`)를 다시 불러옵니다. 처음 열릴 때 한 번만 불러오면 책을 완독하고 돌아와도 화면이 갱신되지 않는 문제가 있었습니다.

## 읽기 화면 (5단계)

설계 문서에 스트릭/유예/밀린 장수의 정확한 계산식이 없어서, 아래 규칙으로 직접 정의했습니다. 필요하면 `src/services/readingService.ts`와 `src/constants/readingConfig.ts`를 수정하세요.

- **하루 목표 장수**: `src/constants/readingConfig.ts`의 `DAILY_CHAPTER_GOAL`(기본 5장) 하나로 관리. 숫자만 바꾸면 전체 로직에 반영됩니다.
- **읽었어요! / N장 더 읽었어요!는 완전히 독립적인 하루 1회 액션**입니다. 하나를 눌렀다고 다른 하나가 사라지지 않고, 각자 회색으로 비활성화("오늘 읽음 완료" / "오늘 사용 완료")될 뿐입니다.
  - **읽었어요!**: 오늘 아직 안 눌렀으면 활성화. 누르면 `DAILY_CHAPTER_GOAL`만큼 진행 + 스트릭 갱신(`user.lastReadAt` 기준).
  - **N장 더 읽었어요!**: **밀린 장수(overdueChapters)가 0보다 클 때만** 아예 나타나는 별도 버튼입니다(0이면 버튼 자체가 안 보임). 가입 첫날에는 밀린 게 없으니 뜨지 않습니다. 오늘 아직 안 썼으면 활성화되고, 하루에 한 번만 쓸 수 있습니다(`user.lastExtraReadAt` 기준, 스트릭과는 무관). 선택 가능한 장수는 1장부터 `min(밀린 장수, 책에 남은 장수)`까지 전부 고를 수 있습니다(짝수 포함).
- **스트릭/유예(streakDays/graceDaysLeft)**: 책 단위가 아니라 유저 전역 기준이고, **"읽었어요!"에서만** 갱신됩니다("N장 더 읽었어요!"는 밀린 걸 갚는 것뿐이라 스트릭에 영향 없음). 어제 이어서 읽으면 연속 기록 +1, 하루 이상 건너뛰면 남은 유예일로 커버를 시도하고, 유예를 초과하면 스트릭이 1로 리셋됩니다. 9단계(Cloud Functions)에서 매일 자정 서버 로직으로 보완할 예정이라, 지금은 "읽었어요"를 누르는 시점에만 클라이언트에서 계산합니다.
  - 가입 직후(`graceDaysLeft` 기본값 2, `overdueChapters` 0)는 첫 "읽었어요!" 이후와 동일한 상태라, **가입 첫날에는 아래 스트릭 경고 배너가 뜨지 않습니다.**
- **스트릭 경고 배너(`StreakWarningBanner`)**: 유예일이 2일 미만이거나 밀린 장수가 있으면 읽기 화면 상단에 `🔥 끊어진 불꽃을 다시 태울 수 있는 기회! {n}일 남았습니다!`(유예 소진 시에는 `오늘까지입니다!`)를 표시합니다.
- **밀린 장수 계산 (`computeLiveOverdueChapters`)**: 세 요소를 더해서 화면을 열 때마다 그 자리에서 다시 계산합니다.
  1. **원금(`overdueChapters`)**: "읽었어요!"를 눌렀는데 그 사이에 공백(안 읽은 날)이 있었으면, 그 공백만큼만 그 순간에 확정되어 누적됩니다. **"읽었어요!"를 눌러도 공백이 없었다면(연속으로 읽는 정상 케이스) 원금은 절대 안 바뀝니다.**
  2. **진행중인 미확정 공백**: 마지막으로 "읽었어요!"를 누른 날(또는 한 번도 안 눌렀으면 가입일) 이후 아직 확정 안 된 공백을 실시간으로 계산해 더합니다 — 그래서 액션 없이 며칠이 지나도 화면엔 정확히 늘어난 값이 보입니다.
  3. **상환액(`extraChaptersRepaid`)**: "N장 더 읽었어요!"로 지금까지 갚은 누적 장수를 뺍니다. **이 버튼만이 밀린 장수를 줄일 수 있습니다.**
  
  즉 **"읽었어요!"는 밀린 장수를 늘리지도 줄이지도 않고(그 자리에서 공백을 확정만 시킴), 오직 "N장 더 읽었어요!"만 실제로 줄입니다.**
- 화이팅 버튼은 `cheerLogs/{fromUserId_toUserId_date}` 문서 존재 여부로 하루 1회 제한을 클라이언트에서 체크합니다. 실제 푸시 알림(FCM)은 9단계에서 Cloud Functions로 붙일 예정입니다.
- **홈으로 나가는 뒤로가기 버튼은 화살표(`<`)만 표시**됩니다(`headerBackButtonDisplayMode: 'minimal'`) — iOS에서 화살표 옆에 이전 화면 제목이 함께 붙어 나오던 것을 없앴습니다.

### 개발 중 테스트하기 (책 잠금 / 밀린 장수)

- **책 잠금 확인**: 로그인 후 홈 로드맵에서 진행중이 아닌(미시작) 책 노드를 눌러보세요. 안내 메시지만 뜨고 들어가지지 않으면 정상입니다. 참여인원/전체 장수는 그 노드에도 그대로 표시됩니다.
- **밀린 장수(N장 더 읽었어요) 확인**: 24시간을 기다리지 않아도 되도록, 읽기 화면 체크리스트 아래에 개발 빌드에서만 보이는 **"🕐 [개발용] 이틀 밀린 것으로 시뮬레이션"** 버튼을 추가했습니다. `createdAt`(가입일)을 이틀 전으로 밀어서 밀린 장수를 실시간 계산 기준으로 실제로 늘어나게 만듭니다. 여러 번 누르면 그만큼 더 밀린 상태(3일, 4일...)도 테스트할 수 있습니다.

## 랭킹 (6단계)

- `users` 컬렉션 전체를 **실시간(onSnapshot)** 구독하고, 클라이언트에서 다음 기준으로 정렬합니다(Firestore 복합 색인이 필요 없도록 서버 정렬 대신 클라이언트 정렬을 씁니다).
  1. **회독수(rereadCount)** 내림차순 — 회독을 많이 한 사람이 먼저.
  2. 회독수가 같으면 **총 진행률(totalProgressPercent)** 내림차순.
- **TOP 3는 단상(포디움) 형식**으로 상단에 표시됩니다(`RankingPodium`, 2등-1등-3등 순으로 배치해 가운데 1등이 가장 높게 보임).
- 그 아래로 **1등부터 50등까지**를 리스트로 나열합니다(`RankingListRow`). 각 행에는 프로필 사진(`photoURL`, 없으면 닉네임 이니셜 아바타), 닉네임, **현재 읽고 있는 위치**(`{책이름} {읽은 장수}/{전체 장수}`, `user.currentBookId`/`currentChapter`를 `src/data/books.ts`의 정적 데이터로 변환), 진척도 막대 그래프(`ProgressBar`) + 소수점 첫째 자리까지의 퍼센트가 표시됩니다. 포디움에도 동일하게 현재 읽는 위치가 표시됩니다.
- 본인을 제외한 모든 참가자의 닉네임 옆에는 본명이 `(본명)` 형식으로 함께 표시됩니다. 본인 행에는 대신 `(나)`가 표시되고 주황색으로 강조됩니다.
- **하단 탭바 바로 위에 내 등수 고정 표시**: 리스트를 드래그해서 내 등수 행이 화면에 보이는 동안에는 사라지고, 화면 밖으로 스크롤돼 안 보이게 되면 다시 하단에 떠서 고정됩니다(`FlatList`의 `onViewableItemsChanged`로 내 행의 가시성을 추적).

### 랭킹 화면 테스트용 더미 유저 55명 생성

- `npm run seed:ranking` — `src/scripts/seedTestRanking.ts`가 닉네임 `테스트유저01`~`테스트유저55`로 더미 유저 55명을 만듭니다(다른 시딩 스크립트와 마찬가지로 `serviceAccountKey.json` 필요).
- 회독수는 0~3회 중 가중치를 둔 무작위값, 총 진행률은 0~100% 무작위값이고 **그 진행률에 맞춰 현재 읽고 있는 책/장수도 앞뒤가 맞게 계산**해서 넣습니다(랭킹 리스트의 "현재 읽고 있는 위치" 표시를 실제처럼 테스트할 수 있도록). `bookProgress` 서브컬렉션까지는 만들지 않으므로 로드맵/읽기 화면 테스트에는 쓸 수 없고, 랭킹 화면 전용입니다.
- 테스트가 끝나면 `npm run reset:users`로 지울 수 있습니다(단, 이 스크립트는 테스트 유저뿐 아니라 **전체 유저**를 삭제하니 실제 가입자가 있다면 주의하세요).

## 마이페이지 (7단계)

- **프로필 사진**: 아바타를 누르면 갤러리에서 사진을 골라(`expo-image-picker`) Firebase Storage(`profilePhotos/{userId}.jpg`)에 업로드하고 `users/{userId}.photoURL`에 저장합니다. 사진이 없으면(또는 로드에 실패하면) 닉네임 첫 글자 아바타가 대신 표시됩니다(랭킹 화면도 동일).
  - 로컬 이미지를 Blob으로 변환할 때 React Native의 `fetch(uri).blob()`은 종종 깨지거나 빈 Blob을 만들어(권한 허용과 업로드 자체는 되지만 사진이 실제로는 바뀌지 않는 것처럼 보이는 원인) Firebase가 RN 환경에 공식 권장하는 `XMLHttpRequest` 기반 변환 방식으로 교체했습니다(`profilePhotoService.ts`).
  - 같은 경로(`profilePhotos/{userId}.jpg`)에 덮어써서 다운로드 URL 문자열이 이전과 동일해질 수 있는 경우를 대비해, 매번 값이 달라지는 쿼리 파라미터(`&_v=타임스탬프`)를 붙여 반환합니다 — RN `<Image>`가 이전 사진을 캐시로 계속 보여주는 것을 방지합니다.
  - `Avatar` 컴포넌트는 이미지 로드가 실패하면(`onError`) 자동으로 닉네임 이니셜로 폴백하고, `photoURL`이 바뀌면 이전 실패 상태를 지우고 다시 시도합니다.
  - 업로드 실패 시 실제 오류 메시지를 화면에 함께 보여주도록 바꿨습니다(콘솔에도 `console.error`로 남깁니다) — 원인 파악용입니다. Storage를 아직 콘솔에서 생성하지 않았거나 보안 규칙이 막고 있으면 이 메시지로 확인할 수 있습니다.
- **내 통계**: 전체 진행률, 연속 읽기(스트릭), 밀린 장수(읽기 화면과 동일하게 `computeLiveOverdueChapters`로 실시간 계산), **회독**(`rereadCount`, 예전 "다시 읽기" 칸에서 이름만 변경)을 카드로 표시합니다.
- **닉네임 변경**: 평생 `NICKNAME_CHANGE_LIMIT`(기본 3회)까지만 가능합니다. 다른 유저와 중복되면 변경할 수 없고, 횟수를 다 쓰면 입력창 자체가 비활성화됩니다.
- **로그아웃**: 확인 Alert 후 세션(AsyncStorage)을 지우고 로그인 화면으로 돌아갑니다.
- ~~처음부터 다시 읽기(수동 초기화) 버튼~~은 없앴습니다. 아래 "회독(다시 읽기) 자동화"를 참고하세요.

### 회독(다시 읽기) 자동화

- 수동 초기화 버튼 대신, **66권 로드맵 노드가 모두 완독으로 바뀌는 순간**(마지막 책까지 다 읽고 "읽었어요!"/"N장 더 읽었어요!"를 누른 시점) `recordChaptersRead`가 자동으로 다음을 처리합니다(`readingService.ts`).
  - 초기화되는 것: 모든 책의 진행 기록(`bookProgress`), `currentBookId`/`currentTestament`/`currentChapter`(본인이 온보딩에서 고른 시작 성경의 1번 책으로), 전체 진행률, 밀린 장수(`overdueChapters`/`extraChaptersRepaid`), 유예일수(`graceDaysLeft`는 2로).
  - 유지되는 것: **연속 읽기(streakDays)와 마지막 읽은 시각(lastReadAt)은 그대로 둡니다** — 같은 액션 안에서 스트릭이 정상적으로 갱신된 뒤에 초기화가 이어지므로, 다음 회독 1일차도 "어제 이어서 읽은" 것으로 자연스럽게 이어집니다.
  - `rereadCount`(회독수)가 1 증가합니다.
  - 방금 완독한 마지막 책의 `bookParticipants` 참여기록을 제거하고, 새로 시작하는 1번 책에 자동으로 참여 등록합니다(다른 책 전환 때와 동일하게 실시간 반영).

> 이전 초기화 로직은 `lastReadAt`을 `null`로 되돌려서, "스트릭은 유지된다"고 안내했음에도 바로 다음 "읽었어요!"에서 스트릭이 1로 리셋되는 숨은 버그가 있었습니다. 이번에 자동화하면서 `lastReadAt`을 건드리지 않도록 고쳐 실제로 스트릭이 이어지게 했습니다.

## 온보딩 (8단계)

- 회원가입 → 로그인 직후, **`hasOnboarded`가 명시적으로 `false`인 유저에게만** 표시됩니다. 온보딩 도입 전에 가입한 기존 유저는 이 필드 자체가 없어(`undefined`) 자동으로 건너뛰고 바로 홈으로 들어갑니다(진행 상황이 리셋되지 않습니다).
- **"구약부터" / "신약부터"** 두 가지 중 하나를 고르면 끝나는 단일 화면입니다.
  - 구약부터(기본값): 창세기(1)~말라기(39)~마태복음(40)~요한계시록(66), 정경 순서 그대로.
  - 신약부터: 마태복음(1)~요한계시록(27)~창세기(28)~말라기(66) — 신약을 앞으로 당겨서 재배열.
- 이 선택은 `users/{userId}`의 `roadmapStartTestament`에 저장되고, `src/data/books.ts`의 `getPersonalizedSequence`가 이 값을 기준으로 **완독 시 다음 책 자동 진행 순서**를 재배열합니다. 구약/신약 드롭다운으로 각 테스타먼트 안의 책 목록을 보는 것 자체는 그대로 유지됩니다. (로드맵 노드에 개인화 순번을 보여주던 배지는 화면이 치우쳐 보인다는 피드백으로 제거했습니다.)
- 온보딩 완료 시 `currentTestament`/`currentBookId`/`currentChapter`가 선택한 시작 성경의 1번 책으로 설정되고 `hasOnboarded: true`로 바뀝니다. 이후 다시 온보딩 화면으로 돌아오지 않습니다(변경하려면 아직 별도 기능이 없습니다).

## 디자인 폴리싱 (10단계 일부)

9단계(Cloud Functions·푸시 알림) 전에 먼저 진행했습니다. 색 조합(네이비+오렌지)은 유지하고 보조 톤/폰트/여백만 정리했습니다.

- **폰트**: 나눔스퀘어라운드(Regular/Bold)를 `assets/fonts/`에 TTF로 번들링하고 `App.tsx`에서 `expo-font`의 `useFonts`로 로드합니다. 로드가 끝나기 전에는 로딩 스피너만 보이고, 끝나면 전체 화면에 적용됩니다(라이선스: OFL-1.1, `assets/fonts/LICENSE.txt` 참고).
  - 커스텀 폰트에 `fontWeight`를 같이 주면 기기에 따라 가짜 볼드가 겹쳐 보일 수 있어서, 굵기는 `fontWeight` 대신 `theme.ts`의 `fonts.regular`/`fonts.bold` 두 폰트 패밀리로 표현합니다.
- **`src/constants/theme.ts`에 토큰 4종 추가**:
  - `spacing` (4/8/12/16/24/32), `radius` (8/12/16/999) — 화면마다 제각각이던 padding/margin/borderRadius 숫자를 통일했습니다.
  - `colors`에 `navyLight`/`orangeLight`/`surface`/`dangerLight`/`success`/`successLight` 등 보조 톤을 추가해 기존에 각 파일마다 따로 적던 `#FFF1E6` 같은 하드코딩 색을 정리했습니다.
  - `typography`에 `h1`/`h2`/`h3`/`body`/`bodyBold`/`caption`/`captionBold`/`small`/`smallBold` 프리셋을 만들어 폰트 패밀리+크기를 한 번에 지정합니다.
- **화면별 반영**: 로그인/회원가입/온보딩, 홈 로드맵(진행중 노드에 그림자 강조, 상태 라벨 색상화), 읽기 화면(밀린 장수 있을 때 빨간색/없을 때 초록색, 읽었어요 버튼에 그림자), 랭킹(상위 3명 메달 이모지), 마이페이지(닉네임 이니셜 아바타)까지 전체 화면에 위 토큰을 적용했습니다.
- **하단 탭바 아이콘화**: 텍스트 라벨 대신 `@expo/vector-icons`의 Ionicons만 사용(랭킹=podium, 홈=home, 마이페이지=person, 선택 시 filled/미선택 시 outline). 전체 아이콘 폰트를 다 번들에 넣지 않도록 `@expo/vector-icons/Ionicons`처럼 서브패스로 직접 import해서 실제 쓰는 아이콘 세트만 포함시켰습니다.
- 홈 로드맵의 상단바/오늘의 목표 플로팅 바/노드 연결 점선은 위 "홈 로드맵" 섹션을 참고하세요.

## 다음 단계

Cloud Functions/푸시 알림(9단계)부터 이어서 진행 예정입니다. 자세한 로드맵은 설계 문서를 참고하세요.
