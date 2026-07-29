# Bible Road

교회 청년부 대상 성경 통독 습관 앱. Expo(React Native) + Firebase(Firestore/FCM) 기반.

> 개발은 설계 문서의 11단계 로드맵을 단계별로 나눠 진행합니다. 현재 완료된 범위: **1~9단계 + 10단계 일부 (프로젝트 셋업 / 정적 데이터 시딩 / 인증 / 홈 로드맵 / 읽기 화면 / 랭킹 / 마이페이지 / 온보딩 / 알림 / 디자인 폴리싱)**. 11단계(테스트/배포)는 **OTA 업데이트(EAS Update) 설정까지** 진행했고, 실제 첫 빌드/스토어 배포는 아직입니다(아래 "배포 & 업데이트" 참고).

## 시작하기

```bash
npm install
cp .env.example .env   # Firebase 설정값을 채워 넣으세요 (아래 참고)
npm start
```

`npm start` 실행 후 터미널에 뜨는 QR코드를 Expo Go 앱으로 스캔하거나 `a`(Android) / `i`(iOS) / `w`(Web) 키로 각 플랫폼에서 실행합니다. 알림 기능(아래 "알림" 섹션)이 서버 없는 로컬 알림이라, Expo Go로도 그대로 확인할 수 있습니다.

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

- 회원가입: 본명 + 닉네임만 입력 (비밀번호 없음). 닉네임은 전체 유일값으로 중복 가입이 불가능합니다. **가입 완료 후 자동 로그인되지 않고, 로그인 화면으로 이동해서(닉네임이 미리 채워진 상태) 다시 로그인해야 홈으로 들어갑니다.**
- 로그인: 닉네임으로 기존 계정을 조회합니다.
- 세션은 기기 로컬(AsyncStorage)에 저장되어 앱을 재실행해도 자동 로그인됩니다(한 번 로그인한 뒤부터는 유지됨).

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
    mypage/                  # MyPageScreen (통계/닉네임 변경/도움말/로그아웃)
    onboarding/              # OnboardingScreen (앱 소개 슬라이드 + 구약/신약 시작 선택)
  components/
    common/                  # Avatar (남색 그라데이션 배경 + 닉네임 첫 글자)
    roadmap/                 # HomeTopBar, TodayGoalFloatingBar, TestamentDropdown, RoadmapNode(그라데이션+병합된 참여자 카드 포함), RoadmapConnector
    reading/                 # ChapterChecklist, TodayGoalCard, StreakWarningBanner, ReadButton, ExtraReadDropdownButton, MemberProgressList, CheerInboxModal(홈 화면 전용 화이팅 팝업)
    ranking/                 # RankingPodium(TOP 3 단상), RankingListRow, ProgressBar
    mypage/                  # HelpModal (연속 불꽃/유예/밀린 장수/회독/화이팅/알림 FAQ)
  context/AuthContext.tsx    # 로그인 상태, 세션 복원, refreshUser
  services/
    firebase.ts              # Firebase 초기화 (Firestore)
    usersService.ts          # users 컬렉션 CRUD, 랭킹 구독, 닉네임 변경, 온보딩 완료 처리
    booksService.ts           # books 컬렉션 조회 (구약/신약 필터, id로 단건 조회)
    bookProgressService.ts    # users/{userId}/bookProgress 조회/저장/전체삭제
    participantsService.ts    # bookParticipants/{bookId}/members 조회/등록/삭제
    cheerLogsService.ts        # 화이팅 전송/조회 (하루 1회 제한, 오늘 받은 화이팅 조회)
    readingService.ts          # "읽었어요/N장 더 읽었어요" 핵심 로직 + 66권 완독 시 자동 회독 처리 (아래 참고)
    notificationsService.ts     # 알림 권한 요청 + 매일 리마인더 로컬 알림 예약 (refreshDailyReminder)
    webPushService.ts           # (웹 전용) Web Push 구독 등록 (registerWebPush)
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
    webPushConfig.ts             # VAPID 공개키 (웹 전용, 아래 "웹(PWA) 알림" 참고)
public/                          # 웹 빌드 시 그대로 복사되는 정적 파일: index.html(PWA 메타태그), manifest.json, sw.js(서비스워커), 아이콘들
workers/reminder-push/           # Cloudflare Worker(웹푸시 발송 서버). Expo 앱과 별개의 프로젝트 — 아래 "웹(PWA) 알림" 참고
wrangler.toml                    # PWA 웹사이트 자체를 배포하는 별도 Worker 설정 (`npm run deploy:web`)
assets/fonts/                    # 나눔스퀘어라운드 Regular/Bold TTF (OFL-1.1, LICENSE.txt 참고)
```

> 원격 푸시(Cloud Functions 기반 화이팅 알림)를 시도했다가 서버 비용 없는 쪽으로 방향을 바꾸면서, SDK도 54로 되돌리고 그 시도에서만 필요했던 설정(`google-services.json` 참조 등)은 정리했습니다. `eas.json`과 `app.json`의 `android.package`는 남겨뒀고, 이제 11단계(배포)에서 실제로 쓰입니다 — 아래 "배포 & 업데이트" 참고. `expo-notifications` 플러그인 설정(아이콘/색상)은 지금 쓰는 로컬 알림에도 그대로 적용됩니다.

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
- **스트릭/유예(streakDays/graceDaysLeft)**: 책 단위가 아니라 유저 전역 기준이고, 실제 Firestore 값은 **"읽었어요!"에서만** 갱신됩니다("N장 더 읽었어요!"는 밀린 걸 갚는 것뿐이라 스트릭에 영향 없음). 어제 이어서 읽으면 연속 기록 +1, 하루 이상 건너뛰면 남은 유예일로 커버를 시도하고, 유예를 초과하면 스트릭이 1로 리셋됩니다. 매일 자정 서버가 따로 계산하지 않아도 되도록, 화면에 보여줄 때는 `computeLiveStreakDays`/`computeLiveOverdueChapters`가 그 자리에서 실시간으로 다시 계산합니다(아래 참고).
  - 가입 직후(`graceDaysLeft` 기본값 2, `overdueChapters` 0)는 첫 "읽었어요!" 이후와 동일한 상태라, **가입 첫날에는 아래 스트릭 경고 배너가 뜨지 않습니다.**
  - **유예(대개 2일)를 넘도록 계속 안 읽으면(`isGraceExpired`)**, 다음 "읽었어요!"를 누르기 전이라도 **화면에는 이미 스트릭이 0으로, 밀린 장수는 0으로 표시됩니다**(`computeLiveStreakDays`/`computeLiveOverdueChapters`가 화면을 열 때마다 그 자리에서 판단). 실제 Firestore 값은 그대로 있다가, 다음 "읽었어요!"를 누르는 순간 `recordChaptersRead`가 스트릭을 1로 리셋하고 그동안의 공백을 원금에 확정합니다.
- **스트릭 경고 배너(`StreakWarningBanner`)**: 밀린 장수가 있을 때만 읽기 화면 상단에 `🔥 끊어진 불꽃을 다시 태울 수 있는 기회! {n}일 남았습니다!`(유예 소진 시에는 `오늘까지입니다!`)를 표시합니다. 밀린 장수가 0이 되면(다 따라잡았든, 유예를 넘겨 화면상 정리됐든) 곧바로 사라집니다.
- **밀린 장수 계산 (`computeLiveOverdueChapters`)**: 유예를 넘기지 않았다면 세 요소를 더해서 화면을 열 때마다 그 자리에서 다시 계산합니다.
  1. **원금(`overdueChapters`)**: "읽었어요!"를 눌렀는데 그 사이에 공백(안 읽은 날)이 있었으면, 그 공백만큼만 그 순간에 확정되어 누적됩니다. **"읽었어요!"를 눌러도 공백이 없었다면(연속으로 읽는 정상 케이스) 원금은 절대 안 바뀝니다.**
  2. **진행중인 미확정 공백**: 마지막으로 "읽었어요!"를 누른 날(또는 한 번도 안 눌렀으면 가입일) 이후 아직 확정 안 된 공백을 실시간으로 계산해 더합니다 — 그래서 액션 없이 며칠이 지나도 화면엔 정확히 늘어난 값이 보입니다.
  3. **상환액(`extraChaptersRepaid`)**: "N장 더 읽었어요!"로 지금까지 갚은 누적 장수를 뺍니다. **이 버튼만이 밀린 장수를 줄일 수 있습니다.**
  
  즉 **"읽었어요!"는 밀린 장수를 늘리지도 줄이지도 않고(그 자리에서 공백을 확정만 시킴), 오직 "N장 더 읽었어요!"만 실제로 줄입니다.**
- **읽기 화면 "오늘의 목표" 카드**: 오른쪽에 🔥 아이콘과 현재 스트릭(연속 읽기 일수)을 함께 보여줍니다(`TodayGoalCard`의 `streakDays` prop, `computeLiveStreakDays`로 계산).
- 화이팅 버튼은 `cheerLogs/{fromUserId_toUserId_date}` 문서 존재 여부로 하루 1회 제한을 클라이언트에서 체크합니다. 다른 사람 기기로 실시간 푸시 알림을 보내는 건 서버가 있어야 가능해서(아래 "알림" 참고) 넣지 않았지만, 대신 **앱을 열 때 그날 받은 화이팅을 조회해 팝업으로 보여주는 방식**(`CheerInboxModal`)으로 상대에게 전달됩니다 — 자세한 내용은 아래 "화이팅 받은 알림(인앱 팝업)" 참고.
- **홈으로 나가는 뒤로가기 버튼은 화살표(`<`)만 표시**됩니다(`headerBackButtonDisplayMode: 'minimal'`) — iOS에서 화살표 옆에 이전 화면 제목이 함께 붙어 나오던 것을 없앴습니다.

### 화이팅 받은 알림 (인앱 팝업)

푸시 서버 없이, **홈 로드맵 화면에 포커스가 올 때마다 그날 나에게 온 화이팅을 다시 조회해서 팝업으로 보여주는 방식**으로 구현했습니다(`CheerInboxModal`, `RoadmapScreen`에만 마운트).

- **홈 로드맵 화면(`RoadmapHome`)에 있을 때만** 뜹니다 — 랭킹/마이페이지 탭이나 읽기 화면에서는 방해되지 않도록 렌더링되지 않습니다. `useFocusEffect`를 써서 다른 탭에서 홈으로 돌아오거나 읽기 화면에서 뒤로 나오는 등 **섹션을 이동해 홈 화면으로 돌아올 때마다** 자동으로 다시 확인하므로, 그 사이에 화이팅이 왔으면 곧바로 팝업이 뜹니다.
- `cheerLogsService.getCheersReceivedToday(userId)`가 오늘 날짜(`dateKey` 필드)로 `cheerLogs`를 조회합니다(등호 조건만 써서 Firestore 복합 색인이 필요 없습니다). `sendCheer`를 보낼 때 보내는 사람의 닉네임(`fromNickname`)도 같이 저장해두어, 받는 쪽에서 유저 문서를 추가로 조회할 필요가 없습니다.
- 이미 보여준 화이팅은 기기에(`AsyncStorage`, 유저별 키) id를 저장해두고 제외합니다 — 그래서 같은 화이팅이 홈 화면에 다시 올 때마다 반복해서 뜨지 않고, **새로 온 화이팅이 있을 때만** 팝업이 뜹니다.
- 팝업 안에는 보낸 사람 닉네임과 함께 **"나도 화이팅!" 버튼**이 있어, 그 자리에서 바로 답장을 보낼 수 있습니다(이미 오늘 그 사람에게 보냈으면 "보냄"으로 비활성화). 이 답장도 동일한 `sendCheer`를 그대로 사용합니다.
- 여전히 실시간 푸시는 아닙니다 — 홈 화면에 포커스가 와야만 확인됩니다. 상대가 화이팅을 보낸 시점에 내 기기에 즉시 알림이 뜨는 건 아니고, 다른 탭/화면에 머물러 있는 동안에는 확인되지 않습니다.

## 랭킹 (6단계)

- `users` 컬렉션 전체를 **실시간(onSnapshot)** 구독하고, 클라이언트에서 다음 기준으로 정렬합니다(Firestore 복합 색인이 필요 없도록 서버 정렬 대신 클라이언트 정렬을 씁니다).
  1. **회독수(rereadCount)** 내림차순 — 회독을 많이 한 사람이 먼저.
  2. 회독수가 같으면 **총 진행률(totalProgressPercent)** 내림차순.
- **TOP 3는 단상(포디움) 형식**으로 상단에 표시됩니다(`RankingPodium`, 2등-1등-3등 순으로 배치해 가운데 1등이 가장 높게 보임).
- 그 아래로 **1등부터 50등까지**를 리스트로 나열합니다(`RankingListRow`). 각 행에는 아바타(남색 그라데이션 배경 + 닉네임 첫 글자), 닉네임, **현재 읽고 있는 위치**(`{책이름} {읽은 장수}/{전체 장수}`, `user.currentBookId`/`currentChapter`를 `src/data/books.ts`의 정적 데이터로 변환), 진척도 막대 그래프(`ProgressBar`) + 소수점 첫째 자리까지의 퍼센트가 표시됩니다. 포디움에도 동일하게 현재 읽는 위치가 표시됩니다.
- 닉네임만 표시되고 본명은 화면에 노출되지 않습니다(`RankingEntry`에 `name` 필드 자체가 없습니다). 본인 행에만 닉네임 옆에 `(나)`가 표시되고 주황색으로 강조됩니다.
- **하단 탭바 바로 위에 내 등수 고정 표시**: 리스트를 드래그해서 내 등수 행이 화면에 보이는 동안에는 사라지고, 화면 밖으로 스크롤돼 안 보이게 되면 다시 하단에 떠서 고정됩니다(`FlatList`의 `onViewableItemsChanged`로 내 행의 가시성을 추적).

### 랭킹 화면 테스트용 더미 유저 55명 생성

- `npm run seed:ranking` — `src/scripts/seedTestRanking.ts`가 닉네임 `테스트유저01`~`테스트유저55`로 더미 유저 55명을 만듭니다(다른 시딩 스크립트와 마찬가지로 `serviceAccountKey.json` 필요).
- 회독수는 0~3회 중 가중치를 둔 무작위값, 총 진행률은 0~100% 무작위값이고 **그 진행률에 맞춰 현재 읽고 있는 책/장수도 앞뒤가 맞게 계산**해서 넣습니다(랭킹 리스트의 "현재 읽고 있는 위치" 표시를 실제처럼 테스트할 수 있도록). `bookProgress` 서브컬렉션까지는 만들지 않으므로 로드맵/읽기 화면 테스트에는 쓸 수 없고, 랭킹 화면 전용입니다.
- `createdAt`(가입 시각)도 실제처럼 보이도록 최근 2년 내 무작위 시점으로 흩어 넣습니다.
- 테스트가 끝나면 `npm run reset:users`로 지울 수 있습니다(단, 이 스크립트는 테스트 유저뿐 아니라 **전체 유저**를 삭제하니 실제 가입자가 있다면 주의하세요).

## 마이페이지 (7단계)

- **프로필 아바타**: 사진 업로드 기능은 없앴습니다(Firebase Storage에 더 이상 의존하지 않습니다). `Avatar` 컴포넌트는 모두 동일한 남색 그라데이션(`gradients.navy`, `expo-linear-gradient`) 배경 위에 닉네임 첫 글자를 표시합니다. 사람마다 다른 색을 쓰면 화면이 산만해 보인다는 피드백으로, 전부 같은 톤으로 통일했습니다. 마이페이지/랭킹 화면 모두 동일하게 적용됩니다.
- **내 통계**: 전체 진행률, 연속 읽기(스트릭), 밀린 장수(읽기 화면과 동일하게 `computeLiveOverdueChapters`로 실시간 계산), **회독**(`rereadCount`, 예전 "다시 읽기" 칸에서 이름만 변경)을 카드로 표시합니다.
- **닉네임 변경**: 평생 `NICKNAME_CHANGE_LIMIT`(기본 3회)까지만 가능합니다. 다른 유저와 중복되면 변경할 수 없고, 횟수를 다 쓰면 입력창 자체가 비활성화됩니다.
- **로그아웃**: 확인 Alert 후 세션(AsyncStorage)을 지우고 로그인 화면으로 돌아갑니다.
- ~~처음부터 다시 읽기(수동 초기화) 버튼~~은 없앴습니다. 아래 "회독(다시 읽기) 자동화"를 참고하세요.
- **도움말**: 로그아웃 버튼 위에 "❓ 도움말" 버튼을 누르면 연속 불꽃/유예/밀린 장수/회독/화이팅/알림/로드맵 순서 같은 핵심 규칙을 Q&A 형식으로 정리한 모달(`HelpModal`)이 뜹니다.

### 회독(다시 읽기) 자동화

- 수동 초기화 버튼 대신, **66권 로드맵 노드가 모두 완독으로 바뀌는 순간**(마지막 책까지 다 읽고 "읽었어요!"/"N장 더 읽었어요!"를 누른 시점) `recordChaptersRead`가 자동으로 다음을 처리합니다(`readingService.ts`).
  - 초기화되는 것: 모든 책의 진행 기록(`bookProgress`), `currentBookId`/`currentTestament`/`currentChapter`(본인이 온보딩에서 고른 시작 성경의 1번 책으로), 전체 진행률, 밀린 장수(`overdueChapters`/`extraChaptersRepaid`), 유예일수(`graceDaysLeft`는 2로).
  - 유지되는 것: **연속 읽기(streakDays)와 마지막 읽은 시각(lastReadAt)은 그대로 둡니다** — 같은 액션 안에서 스트릭이 정상적으로 갱신된 뒤에 초기화가 이어지므로, 다음 회독 1일차도 "어제 이어서 읽은" 것으로 자연스럽게 이어집니다.
  - `rereadCount`(회독수)가 1 증가합니다.
  - 방금 완독한 마지막 책의 `bookParticipants` 참여기록을 제거하고, 새로 시작하는 1번 책에 자동으로 참여 등록합니다(다른 책 전환 때와 동일하게 실시간 반영).

> 이전 초기화 로직은 `lastReadAt`을 `null`로 되돌려서, "스트릭은 유지된다"고 안내했음에도 바로 다음 "읽었어요!"에서 스트릭이 1로 리셋되는 숨은 버그가 있었습니다. 이번에 자동화하면서 `lastReadAt`을 건드리지 않도록 고쳐 실제로 스트릭이 이어지게 했습니다.

## 온보딩 (8단계)

- 회원가입 → 로그인 직후, **`hasOnboarded`가 명시적으로 `false`인 유저에게만** 표시됩니다. 온보딩 도입 전에 가입한 기존 유저는 이 필드 자체가 없어(`undefined`) 자동으로 건너뛰고 바로 홈으로 들어갑니다(진행 상황이 리셋되지 않습니다).
- **여러 장면(슬라이드)으로 앱 사용법을 먼저 소개**합니다(`INTRO_SLIDES`, 화면 상단 점으로 진행 표시): 환영 인사 → 로드맵(완독/진행중 색 구분, 자동 진행) → 연속 불꽃/유예 → 랭킹/화이팅 → 알림, 순서로 "다음" 버튼을 눌러 하나씩 넘어갑니다.
- 마지막 장면에서 **"구약부터" / "신약부터"** 중 하나를 고르면 온보딩이 끝납니다.
  - 구약부터(기본값): 창세기(1)~말라기(39)~마태복음(40)~요한계시록(66), 정경 순서 그대로.
  - 신약부터: 마태복음(1)~요한계시록(27)~창세기(28)~말라기(66) — 신약을 앞으로 당겨서 재배열.
- 이 선택은 `users/{userId}`의 `roadmapStartTestament`에 저장되고, `src/data/books.ts`의 `getPersonalizedSequence`가 이 값을 기준으로 **완독 시 다음 책 자동 진행 순서**를 재배열합니다. 구약/신약 드롭다운으로 각 테스타먼트 안의 책 목록을 보는 것 자체는 그대로 유지됩니다. (로드맵 노드에 개인화 순번을 보여주던 배지는 화면이 치우쳐 보인다는 피드백으로 제거했습니다.)
- 온보딩 완료 시 `currentTestament`/`currentBookId`/`currentChapter`가 선택한 시작 성경의 1번 책으로 설정되고 `hasOnboarded: true`로 바뀝니다. 이후 다시 온보딩 화면으로 돌아오지 않습니다(변경하려면 아직 별도 기능이 없습니다).

## 알림 (9단계)

서버(Cloud Functions/Blaze 요금제) 없이, **기기에 직접 예약하는 로컬 알림**만으로 구현했습니다. 그래서 원격 푸시와 달리 비용이 전혀 들지 않고, Expo Go에서도 그대로 동작합니다(원격 푸시만 Expo Go 제한 대상이라 이 기능은 해당 없음).

- 다른 사람 기기로 **실시간 푸시**를 보내는 기능은 구조상 서버 없이는 불가능해서 넣지 않았습니다. 대신 화이팅은 앱을 열 때 인앱 팝업으로 확인하는 방식으로 구현했습니다 — "읽기 화면" 문서의 "화이팅 받은 알림(인앱 팝업)" 참고.
- **매일 리마인더**만 로컬 알림으로 구현했습니다: `users/{userId}.dailyReminderTime`(현재는 변경 화면이 없어 항상 `"20:00"`)에 맞춰, 그 시각에 아직 "읽었어요!"를 안 눌렀으면 "오늘의 목표를 아직 다 못 채우셨어요!" 알림이 뜹니다.

### 동작 방식 (`src/services/notificationsService.ts`)

- `refreshDailyReminder(dailyReminderTime, hasReadToday)`가 핵심 함수입니다. **로그인/세션 복원 직후**, 그리고 **"읽었어요!"가 성공해서 `lastReadAt`이 바뀔 때마다**(`AuthContext`의 `useEffect`) 호출됩니다.
- 매번 호출될 때마다: 기존에 예약해둔 리마인더를 취소하고, 다시 계산해서 새로 예약합니다.
  - 오늘 아직 안 읽었고 리마인더 시각이 아직 안 지났으면 → **오늘** 그 시각으로 예약.
  - 오늘 이미 읽었거나, 리마인더 시각이 이미 지났으면 → **내일** 같은 시각으로 예약.
- 알림 권한이 없으면(거부했거나 시뮬레이터) 조용히 아무 것도 하지 않습니다.
- **한계**: 이 방식은 앱을 열거나 "읽었어요!"를 누를 때마다 "다음 리마인더"를 한 번씩만 미리 예약해두는 구조라, **앱을 2일 이상 연속으로 아예 안 열면** 그 사이 어느 하루는 리마인더가 안 올 수 있습니다(하루 정도는 이전에 예약해둔 게 남아있어 오지만, 그 다음날 걸 다시 예약할 기회가 없기 때문). 매일 여는 습관 앱 특성상 실사용에서는 문제없을 것으로 예상하지만, 완벽히 보장하려면 향후 며칠치를 한꺼번에 예약해두는 방식으로 보완할 수 있습니다.

### 확인하는 법

앱에서 알림 권한을 허용하고, 오늘 아직 "읽었어요!"를 누르지 않은 상태로 리마인더 시각(기본 20:00)까지 기다리면 알림이 옵니다. "읽었어요!"를 누른 뒤에는 오늘 알림이 뜨지 않고, 다음날 같은 시각으로 다시 예약된 걸 확인할 수 있습니다.

### 웹(PWA) 알림 (Web Push)

iOS는 앱스토어에 정식 배포하려면 연 $99 Apple Developer Program이 필요합니다. 그 대안으로, 웹앱을 **PWA(홈 화면에 추가)**로 설치하면 Apple 계정 없이도 알림을 받을 수 있도록 만들었습니다. 다만 브라우저에는 네이티브처럼 "서버 없이 로컬에 예약"하는 기능이 아예 없어서, 이 경로만은 작은 서버(Cloudflare Worker, 무료)가 필요합니다.

- **PWA 설치**: `public/manifest.json` + `public/sw.js` + `public/index.html`(매니페스트·apple-touch-icon 링크, 서비스워커 등록 스크립트)로 구성됩니다. 사용자가 사파리/크롬에서 사이트 접속 후 "홈 화면에 추가"를 하면 일반 앱처럼 아이콘이 생기고 전체 화면으로 실행됩니다.
- **구독 등록**: `src/services/webPushService.ts`의 `registerWebPush(userId)`가 웹에서만(`Platform.OS === 'web'`) 동작합니다. 서비스워커 등록 → 알림 권한 요청 → `PushManager.subscribe`로 구독 생성 → `webPushSubscriptions/{userId}` 문서에 저장(`endpoint`, `keys.p256dh`, `keys.auth`). `AuthContext`에서 로그인 직후 호출되며, 네이티브 앱의 `refreshDailyReminder`와는 완전히 분리되어 있습니다(웹은 이쪽, 네이티브는 그쪽).
- **발송 서버**: `workers/reminder-push/`는 Expo 앱과 별개인 **Cloudflare Worker** 프로젝트입니다. 매일 11:00 UTC(20:00 KST)에 Cron Trigger로 실행되어, `webPushSubscriptions` 컬렉션을 전부 조회하고 각 유저의 `lastReadAt`을 확인해 그날 아직 안 읽은 사람에게만 Web Push를 보냅니다. Web Push 프로토콜 자체(VAPID + 페이로드 암호화)는 Workers/Web Crypto 환경에 맞는 `@block65/webcrypto-web-push` 패키지를 씁니다. Firestore는 `firebase-admin`(Node 전용이라 Workers에서 못 씀) 대신, 서비스 계정으로 Google OAuth2 토큰을 직접 발급받아 REST API로 읽고 씁니다(`src/googleAuth.ts`, `src/firestore.ts`).
- **비용**: Cloudflare Workers 무료 티어, Web Push 자체도 무료 오픈 표준이라 이 알림 경로엔 돈이 들지 않습니다.

**한계**:
- iOS 16.4 이상 + 반드시 "홈 화면에 추가"를 해야 알림이 옵니다(사파리 탭으로만 열면 알림 자체가 안 옴). 안드로이드 크롬은 홈 화면 추가 없이도 비교적 잘 동작합니다.
- 하루 한 번(20:00 KST)만 확인하는 구조라, 네이티브 로컬 알림처럼 "오늘 읽으면 알림이 안 뜨고 다음날로 재예약"되는 정교한 동작은 아니고 그냥 그 순간 안 읽었으면 보내는 방식입니다.
- 구독이 만료/삭제된 경우(브라우저가 410/404를 반환) Worker가 자동으로 Firestore에서 해당 구독을 정리합니다.

**배포 방법** (Cloudflare 계정 필요, 아래는 `workers/reminder-push/` 안에서 실행):
1. Firebase 콘솔 > 프로젝트 설정 > 서비스 계정에서 발급받은 `client_email`/`private_key`(`serviceAccountKey.json`과 같은 것) 준비.
2. `wrangler.toml`의 `[vars]`에 `FIREBASE_PROJECT_ID`(Firebase 프로젝트 ID)를 채워 넣기.
3. 시크릿 등록(값은 커밋하지 말고 이 명령으로만 등록):
   ```
   npx wrangler login
   npx wrangler secret put FIREBASE_CLIENT_EMAIL
   npx wrangler secret put FIREBASE_PRIVATE_KEY
   npx wrangler secret put VAPID_PUBLIC_KEY
   npx wrangler secret put VAPID_PRIVATE_KEY
   ```
   (VAPID 키는 이미 한 쌍 발급해서 전달드렸습니다. 공개키는 `src/constants/webPushConfig.ts`에도 이미 들어가 있습니다.)
4. `npm install && npx wrangler deploy`

### PWA 웹사이트 배포

위 발송 서버(`bible-road-reminder-push`)와는 **별개의 Cloudflare Worker**로, 실제 사용자가 접속해서 "홈 화면에 추가"할 웹사이트 자체를 배포합니다. 루트의 `wrangler.toml`(Worker 이름: `bible-road`)이 이 배포를 담당합니다 — **`workers/reminder-push` 폴더가 아니라 프로젝트 루트에서** 실행해야 합니다.

```
npm run deploy:web
```

이 명령은 `expo export --platform web`으로 `dist/`에 웹 빌드를 만든 뒤, 그 폴더를 그대로 Cloudflare에 정적 사이트로 올립니다(`public/`의 매니페스트·서비스워커·아이콘도 함께 포함됩니다). 배포되면 `https://bible-road.<workers.dev 서브도메인>.workers.dev` 같은 주소가 나오고, 이 주소가 실제 사용자에게 공유할 PWA 주소입니다.

> 헷갈리기 쉬운 부분: `npx wrangler deploy`를 프로젝트 루트에서 실행하면 이 웹사이트(`bible-road`)가, `workers/reminder-push` 폴더 안에서 실행하면 발송 서버(`bible-road-reminder-push`)가 배포됩니다. 폴더를 확인하고 실행하세요.

### 자동 배포 (GitHub Actions)

로컬에서 매번 `npm run deploy:web`을 직접 실행하지 않아도 되도록, `.github/workflows/deploy-web.yml`에 GitHub Actions를 만들어뒀습니다. `main` 또는 `claude/app-development-518k3w` 브랜치에 `src/`, `public/`, `assets/`, `app.json` 등 관련 파일이 바뀐 채로 푸시되면 GitHub 서버에서 자동으로 `expo export --platform web` + `wrangler deploy`를 실행합니다(수동 실행은 저장소의 Actions 탭에서 "Run workflow"로도 가능).

**한 번만 설정하면 되는 것** (GitHub 저장소 Settings > Secrets and variables > Actions에서 등록):

1. **`CLOUDFLARE_API_TOKEN`**: https://dash.cloudflare.com/profile/api-tokens 접속 → "Create Token" → **"Edit Cloudflare Workers"** 템플릿 선택 → 생성된 토큰 값을 복사.
2. **`CLOUDFLARE_ACCOUNT_ID`**: Cloudflare 대시보드 아무 페이지에서나 오른쪽 사이드바(또는 Workers & Pages 개요 페이지)에 표시되는 Account ID 값.

이 두 개를 GitHub 저장소 Secrets에 등록해두면, 그 다음부터는 `git push`만으로 웹사이트가 자동 배포됩니다. (발송 서버 `workers/reminder-push`는 자주 안 바뀌는 편이라 자동화하지 않고 필요할 때만 수동으로 `npx wrangler deploy` 하면 됩니다.)

## 디자인 폴리싱 (10단계 일부)

9단계(알림) 전에 먼저 진행했습니다. 색 조합(네이비+오렌지)은 유지하고 보조 톤/폰트/여백만 정리했습니다.

- **폰트**: 나눔스퀘어라운드(Regular/Bold)를 `assets/fonts/`에 TTF로 번들링하고 `App.tsx`에서 `expo-font`의 `useFonts`로 로드합니다. 로드가 끝나기 전에는 로딩 스피너만 보이고, 끝나면 전체 화면에 적용됩니다(라이선스: OFL-1.1, `assets/fonts/LICENSE.txt` 참고).
  - 커스텀 폰트에 `fontWeight`를 같이 주면 기기에 따라 가짜 볼드가 겹쳐 보일 수 있어서, 굵기는 `fontWeight` 대신 `theme.ts`의 `fonts.regular`/`fonts.bold` 두 폰트 패밀리로 표현합니다.
- **`src/constants/theme.ts`에 토큰 4종 추가**:
  - `spacing` (4/8/12/16/24/32), `radius` (8/12/16/999) — 화면마다 제각각이던 padding/margin/borderRadius 숫자를 통일했습니다.
  - `colors`에 `navyLight`/`orangeLight`/`surface`/`dangerLight`/`success`/`successLight` 등 보조 톤을 추가해 기존에 각 파일마다 따로 적던 `#FFF1E6` 같은 하드코딩 색을 정리했습니다.
  - `typography`에 `h1`/`h2`/`h3`/`body`/`bodyBold`/`caption`/`captionBold`/`small`/`smallBold` 프리셋을 만들어 폰트 패밀리+크기를 한 번에 지정합니다.
- **화면별 반영**: 로그인/회원가입/온보딩, 홈 로드맵(진행중 노드에 그림자 강조, 상태 라벨 색상화), 읽기 화면(밀린 장수 있을 때 빨간색/없을 때 초록색, 읽었어요 버튼에 그림자), 랭킹(상위 3명 메달 이모지), 마이페이지(닉네임 이니셜 아바타)까지 전체 화면에 위 토큰을 적용했습니다.
- **하단 탭바 아이콘화**: 텍스트 라벨 대신 `@expo/vector-icons`의 Ionicons만 사용(랭킹=podium, 홈=home, 마이페이지=person, 선택 시 filled/미선택 시 outline). 전체 아이콘 폰트를 다 번들에 넣지 않도록 `@expo/vector-icons/Ionicons`처럼 서브패스로 직접 import해서 실제 쓰는 아이콘 세트만 포함시켰습니다.
- 앱을 처음 열었을 때(로그인 직후) 보이는 첫 화면은 항상 **홈 로드맵**입니다(`MainTabs`의 `initialRouteName="RoadmapTab"`). 탭 순서 자체(랭킹-홈-마이페이지)와는 별개입니다.
- 홈 로드맵의 상단바/오늘의 목표 플로팅 바/노드 연결 점선은 위 "홈 로드맵" 섹션을 참고하세요.

### 앱 아이콘 / 스플래시

- **아이콘**(`assets/icon.png`, `android-icon-foreground/background/monochrome.png`): 책+구불구불한 길+위치 핀 3개(주황/파랑/초록) 디자인. 원본 그림이 캔버스의 86%만 채우고 있어서 iOS/웹에서 실제 다른 앱 아이콘보다 작아 보이는 문제가 있었고, 안드로이드 adaptive icon 전경 레이어는 원형/스퀴클 마스크에 걸쳐 잘릴 정도로 그림이 가장자리까지 뻗어 있었습니다. 둘 다 안전 영역에 맞게 다시 스케일링했습니다.
- **스플래시**(`assets/splash-icon.png`): 같은 디자인의 플랫 버전(책+길+핀+"Bible Road" 워드마크, 어두운 회색)입니다. 이 그림은 어두운 배경이 아니라 **밝은 배경 위에 놓이도록 만들어진 디자인**이라, `expo-splash-screen` 플러그인 설정에서 배경색을 네이비가 아니라 흰색(`#FFFFFF`)으로 지정했습니다(`app.json`의 `plugins` 참고, 이미지 너비 220). 네이티브 빌드에만 적용되고(새로 `eas build`해야 반영), 웹(PWA)에는 스플래시 개념 자체가 없어서(브라우저가 로딩 중 흰 화면을 잠깐 보여주는 정도) 영향 없습니다.

## 배포 & 업데이트 (11단계 일부)

배포 이후 "버전이 달라지면 업데이트할 수 있어야 한다"는 요구사항에 맞춰, **EAS Update(OTA)**를 세팅했습니다. 스토어 배포 후 대부분의 수정(화면 로직, 스타일, 텍스트 등 JS/에셋 변경)을 **스토어 재심사 없이** 즉시 배포할 수 있게 하기 위해서입니다. 서버 비용도 들지 않고(개인/소규모 무료 한도 안에서 충분), Expo Go 사용에도 영향이 없습니다(Expo Go는 이 설정을 쓰지 않고 자체 방식으로 동작합니다) — `npx expo start`로 하는 평소 테스트는 지금까지와 동일합니다.

### 업데이트 방식은 두 갈래입니다

- **JS/에셋만 바뀐 경우** (대부분의 기능 수정/버그 수정): `npm run update:preview` 또는 `npm run update:production`으로 **OTA 배포**합니다. 사용자가 다음에 앱을 열 때 자동으로 최신 번들을 받습니다.
- **네이티브 변경이 있는 경우** (새 네이티브 모듈 추가, 아이콘/권한 등 `app.json`의 네이티브 설정 변경, Expo SDK 버전업 등): OTA로는 반영되지 않습니다. `app.json`의 `version`(및 필요하면 `android.versionCode`)을 올리고 `npm run build:android:preview`(내부 테스트) 또는 `eas build --platform android --profile production`(스토어 제출용)으로 **새 바이너리를 다시 빌드**해서 배포해야 합니다.

### 지금까지 세팅한 것

- `expo-updates` 패키지 설치, `app.json`에 `runtimeVersion.policy: "appVersion"`(네이티브 버전이 같은 빌드끼리만 OTA를 받도록 함) 추가.
- `eas.json`의 `preview`/`production` 빌드 프로필에 각각 `channel`(`preview`/`production`)을 지정해, 어떤 빌드가 어떤 업데이트 채널을 구독하는지 연결.
- `package.json`에 `update:preview`/`update:production` 스크립트 추가.

### 진행된 것 / 남은 것

`eas init`은 이미 실행되어 `app.json`에 실제 `extra.eas.projectId`(`71ebded7-92d1-4847-a1a0-1f8d6cc29aff`)와 `owner`가 채워져 있습니다. `eas build`는 이 값만으로 바로 됩니다.

- `npm run build:android:preview`(내부 테스트 APK) 또는 `eas build --platform android --profile production`(스토어 제출용 앱 번들)으로 빌드 가능.
- **OTA 업데이트(`eas update`)는 아직 한 단계 더 필요할 수 있습니다** — `app.json`에 `updates.url` 필드가 없어서(현재 SDK 버전에서 `eas init`이 자동으로 넣어주지 않았습니다), `npx eas update:configure`를 한 번 실행해 채워 넣어야 `npm run update:preview`/`update:production`이 정상 동작합니다. 순수 `eas build`(새 빌드)만 할 거라면 이 단계 없이도 됩니다.

## 다음 단계

11단계(테스트/배포)부터 이어서 진행 중입니다. 남은 것: PWA 웹사이트/웹푸시 발송 서버는 배포 완료(위 "웹(PWA) 알림" 참고), OTA 업데이트 마무리(`eas update:configure`)와 앱스토어/Play 스토어 정식 제출은 아직입니다. 자세한 로드맵은 설계 문서를 참고하세요.
