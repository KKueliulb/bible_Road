export type Testament = 'OT' | 'NT';

export type ReminderSchedule = 'morning' | 'evening' | 'both';

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
  /** totalProgressPercent가 마지막으로 바뀐 시각. 랭킹에서 회독수·진행률이 모두 같으면 이 값이 더 이른(먼저 그 진척도를 달성한) 사람이 위로 온다. */
  progressUpdatedAt: number;
  streakDays: number;
  lastReadAt: number | null;
  lastExtraReadAt: number | null;
  /** "읽었어요!"에서 공백(밀린 날)이 확정될 때만 누적되는 원금. "N장 더 읽었어요!"로는 줄지 않는다. */
  overdueChapters: number;
  /** "N장 더 읽었어요!"로 지금까지 상환한 누적 장수. 밀린 장수 표시 시 이 값만큼 차감한다. */
  extraChaptersRepaid: number;
  graceDaysLeft: number;
  rereadCount: number;
  /** 매일 리마인더 로컬 알림을 예약할 시각("HH:mm"). 네이티브 전용이며 현재 미사용(PWA 웹푸시로 대체). */
  dailyReminderTime: string;
  /** 웹 푸시 리마인더를 받을 시간대. 매일 아침 8시/저녁 8시(KST) Cron 중 어느 쪽을 받을지 선택. */
  reminderSchedule: ReminderSchedule;
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

/** 웹(PWA)에서 등록한 Web Push 구독 정보. Cloudflare Worker가 매일 저녁 8시(KST)에 이 문서들을 조회해 발송한다. */
export interface WebPushSubscriptionDoc {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  updatedAt: number;
}
