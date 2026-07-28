import { Book } from './booksService';
import { saveBookProgress } from './bookProgressService';
import { updateUser } from './usersService';
import { TOTAL_BIBLE_CHAPTERS } from '../data/books';
import { DAILY_CHAPTER_GOAL } from '../constants/readingConfig';
import { BookProgressDoc, UserDoc } from '../types/models';

function dateOnly(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function diffCalendarDays(fromMs: number, toMs: number): number {
  return Math.round((dateOnly(toMs) - dateOnly(fromMs)) / 86400000);
}

export function hasReadToday(lastReadAt: number | null): boolean {
  if (lastReadAt === null) return false;
  return diffCalendarDays(lastReadAt, Date.now()) === 0;
}

interface RecordReadingParams {
  userId: string;
  user: UserDoc;
  book: Book;
  existingProgress: BookProgressDoc | null;
  chapterCount: number;
  /** 이 책을 제외한, 지금까지 읽은 다른 모든 책의 장수 합 (진척도 재계산용) */
  otherBooksChaptersReadTotal: number;
}

interface RecordReadingResult {
  progress: BookProgressDoc;
  userUpdates: Partial<UserDoc>;
}

/**
 * "읽었어요!" / "N장 더 읽었어요!" 공용 로직.
 * 설계문서에 스트릭/유예/밀린 장수의 정확한 계산식이 없어 아래 규칙으로 구현함(추후 9단계 Cloud Functions에서 보완 가능):
 * - streakDays/lastReadAt/graceDaysLeft는 책 단위가 아니라 유저 전역 기준(오늘 아무 책이나 하나만 읽어도 인정)
 * - overdueChapters = max(0, 가입일 기준 경과일수 * DAILY_CHAPTER_GOAL - 전체 읽은 장수)
 */
export async function recordChaptersRead(params: RecordReadingParams): Promise<RecordReadingResult> {
  const { userId, user, book, existingProgress, chapterCount, otherBooksChaptersReadTotal } = params;

  const currentChaptersRead = existingProgress?.chaptersRead ?? [];
  const alreadyReadCount = currentChaptersRead.length;
  const nextStart = alreadyReadCount + 1;
  const nextEnd = Math.min(alreadyReadCount + chapterCount, book.totalChapters);

  const chaptersToAdd: number[] = [];
  for (let chapter = nextStart; chapter <= nextEnd; chapter += 1) {
    chaptersToAdd.push(chapter);
  }

  const newChaptersRead = [...currentChaptersRead, ...chaptersToAdd];
  const status = newChaptersRead.length >= book.totalChapters ? 'completed' : 'in_progress';
  const progress: BookProgressDoc = {
    chaptersRead: newChaptersRead,
    status,
    completedAt: status === 'completed' ? existingProgress?.completedAt ?? Date.now() : null,
  };

  await saveBookProgress(userId, book.id, progress);

  const now = Date.now();
  const userUpdates: Partial<UserDoc> = {};

  if (!hasReadToday(user.lastReadAt)) {
    let streakDays: number;
    let graceDaysLeft: number;

    if (user.lastReadAt === null) {
      streakDays = 1;
      graceDaysLeft = 2;
    } else {
      const missedDays = diffCalendarDays(user.lastReadAt, now) - 1;
      if (missedDays <= 0) {
        // 어제 읽고 오늘도 읽음 - 연속 기록, 유예 서서히 회복
        streakDays = user.streakDays + 1;
        graceDaysLeft = Math.min(2, user.graceDaysLeft + 1);
      } else if (user.graceDaysLeft >= missedDays) {
        // 며칠 건너뛰었지만 유예로 커버 가능
        streakDays = user.streakDays + 1;
        graceDaysLeft = user.graceDaysLeft - missedDays;
      } else {
        // 유예 초과 - 스트릭 리셋
        streakDays = 1;
        graceDaysLeft = 2;
      }
    }

    userUpdates.lastReadAt = now;
    userUpdates.streakDays = streakDays;
    userUpdates.graceDaysLeft = graceDaysLeft;
  }

  const totalChaptersRead = otherBooksChaptersReadTotal + newChaptersRead.length;
  userUpdates.totalProgressPercent = Math.round((totalChaptersRead / TOTAL_BIBLE_CHAPTERS) * 1000) / 10;

  const daysSinceCreated = diffCalendarDays(user.createdAt, now) + 1;
  const expectedByNow = daysSinceCreated * DAILY_CHAPTER_GOAL;
  userUpdates.overdueChapters = Math.max(0, expectedByNow - totalChaptersRead);

  if (user.currentBookId === book.id) {
    userUpdates.currentChapter = newChaptersRead.length;
  }

  await updateUser(userId, userUpdates);

  return { progress, userUpdates };
}
