export type Testament = 'OT' | 'NT';

export type BookProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface BookDoc {
  name: string;
  testament: Testament;
  order: number;
  totalChapters: number;
}

export interface UserDoc {
  name: string;
  nickname: string;
  nicknameChangeCount: number;
  lastNicknameChangedAt: number | null;
  currentTestament: Testament;
  currentBookId: string;
  currentChapter: number;
  totalProgressPercent: number;
  streakDays: number;
  lastReadAt: number | null;
  lastExtraReadAt: number | null;
  /** "읽었어요!"에서 공백(밀린 날)이 확정될 때만 누적되는 원금. "N장 더 읽었어요!"로는 줄지 않는다. */
  overdueChapters: number;
  /** "N장 더 읽었어요!"로 지금까지 상환한 누적 장수. 밀린 장수 표시 시 이 값만큼 차감한다. */
  extraChaptersRepaid: number;
  graceDaysLeft: number;
  rereadCount: number;
  /** expo-notifications가 발급한 Expo push token(`ExponentPushToken[...]`). Cloud Functions가 Expo Push API로 알림을 보낼 때 쓴다. 로그인 기기가 없거나 권한을 거부했으면 null. */
  expoPushToken: string | null;
  dailyReminderTime: string;
  createdAt: number;
  /** 온보딩에서 고른 시작 성경(구약/신약). 완독 시 다음 책 자동 진행 순서와 로드맵 번호 표시에 쓰인다. */
  roadmapStartTestament: Testament;
  /** 온보딩 완료 여부. 이 필드가 아예 없는(온보딩 도입 전에 가입한) 기존 유저는 온보딩을 건너뛴다. */
  hasOnboarded: boolean;
}

export interface BookProgressDoc {
  chaptersRead: number[];
  status: BookProgressStatus;
  completedAt: number | null;
}

export interface ParticipantDoc {
  nickname: string;
  joinedAt: number;
}
