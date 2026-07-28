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
  fcmToken: string | null;
  dailyReminderTime: string;
  createdAt: number;
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
