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
  overdueChapters: number;
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
