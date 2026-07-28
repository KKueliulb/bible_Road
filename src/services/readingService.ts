import { Book } from './booksService';
import { deleteAllProgress, saveBookProgress } from './bookProgressService';
import { joinBookParticipants, removeParticipant } from './participantsService';
import { updateUser } from './usersService';
import { getPersonalizedSequence, TOTAL_BIBLE_CHAPTERS } from '../data/books';
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

/**
 * 아직 "읽었어요!"로 확정(lock-in)되지 않은, 진행중인 공백 일수.
 * lastReadAt이 있으면 그 다음날까지는 정상(연속)이라 -1 보정, 없으면(한 번도 안 읽음) 가입일 자체가 이미 유예라 보정 없음.
 */
function ongoingGapMissedDays(lastReadAt: number | null, createdAt: number, now: number): number {
  if (lastReadAt === null) {
    return Math.max(0, diffCalendarDays(createdAt, now));
  }
  return Math.max(0, diffCalendarDays(lastReadAt, now) - 1);
}

/**
 * 밀린 장수 = 원금(overdueChapters, "읽었어요!"가 공백을 확정할 때만 누적)
 *           + 아직 확정 안 된 진행중 공백(실시간 계산)
 *           - N장 더 읽었어요로 상환한 누적 장수(extraChaptersRepaid).
 *
 * "읽었어요!"는 원금을 절대 깎지 않고(그 자리에서 공백을 새로 확정할 때만 "늘릴" 수 있음),
 * "N장 더 읽었어요!"는 상환액만 늘려서 이 합계를 줄인다 — 그래서 "읽었어요"를 눌러도 이 숫자는 안 바뀐다.
 * 화면을 열 때마다 이 함수로 그 자리에서 다시 계산해야 한다(저장된 값만 보면 액션 없이는 안 늘어난 것처럼 보임).
 */
export function computeLiveOverdueChapters(
  user: Pick<UserDoc, 'overdueChapters' | 'lastReadAt' | 'createdAt' | 'extraChaptersRepaid'>,
  now: number = Date.now()
): number {
  const ongoingGapChapters = ongoingGapMissedDays(user.lastReadAt, user.createdAt, now) * DAILY_CHAPTER_GOAL;
  const repaid = user.extraChaptersRepaid ?? 0;
  return Math.max(0, user.overdueChapters + ongoingGapChapters - repaid);
}

/**
 * "오늘의 목표"로 표시할 장수 구간. 오늘 "읽었어요!"를 이미 눌렀으면(readToday) 방금 끝낸
 * 구간을 그대로 유지하고(체크 표시는 호출부에서 별도 처리), 다음 날이 되어야 다음 구간으로 넘어간다.
 * 그렇지 않으면 "읽었어요!"를 누르자마자 화면이 곧바로 다음 구간으로 넘어가버려서
 * 마치 오늘 목표를 아직 안 채운 것처럼 보이는 문제가 있었다.
 */
export function computeTodayGoalRange(
  chaptersReadCount: number,
  totalChapters: number,
  readToday: boolean
): { start: number; end: number } {
  const baseline = readToday ? Math.max(0, chaptersReadCount - DAILY_CHAPTER_GOAL) : chaptersReadCount;
  return {
    start: baseline + 1,
    end: Math.min(baseline + DAILY_CHAPTER_GOAL, totalChapters),
  };
}

interface RecordReadingParams {
  userId: string;
  user: UserDoc;
  book: Book;
  existingProgress: BookProgressDoc | null;
  chapterCount: number;
  /** 'base' = "읽었어요!"(오늘 목표, 하루 1회, 스트릭 갱신), 'extra' = "N장 더 읽었어요!"(밀린 장 catch-up, 하루 1회, 스트릭 무관) */
  actionType: 'base' | 'extra';
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
 * - streakDays/lastReadAt/graceDaysLeft/overdueChapters(원금)는 'base' 액션에서만 갱신된다(유저 전역 기준).
 * - lastExtraReadAt/extraChaptersRepaid는 'extra' 액션 전용 — "읽었어요"를 눌렀다고 "N장 더 읽었어요"가
 *   하루치 다 쓴 걸로 처리되지도, 밀린 장수가 줄어들지도 않는다.
 * - 책을 완독하면 그 책이 currentBookId였을 때만 다음 책으로 자동 이동(그렇지 않으면 로드맵에서 다음 책이 영원히 잠겨 있게 됨)
 */
export async function recordChaptersRead(params: RecordReadingParams): Promise<RecordReadingResult> {
  const { userId, user, book, existingProgress, chapterCount, actionType, otherBooksChaptersReadTotal } = params;

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

  if (actionType === 'base' && !hasReadToday(user.lastReadAt)) {
    const missedDays = ongoingGapMissedDays(user.lastReadAt, user.createdAt, now);

    let streakDays: number;
    let graceDaysLeft: number;

    if (user.lastReadAt === null) {
      streakDays = 1;
      graceDaysLeft = 2;
    } else if (missedDays <= 0) {
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

    // 지금까지 확정 안 됐던 공백을 원금에 확정 반영 (이후로는 이 값이 실시간 계산의 기준이 됨)
    if (missedDays > 0) {
      userUpdates.overdueChapters = user.overdueChapters + missedDays * DAILY_CHAPTER_GOAL;
    }

    userUpdates.lastReadAt = now;
    userUpdates.streakDays = streakDays;
    userUpdates.graceDaysLeft = graceDaysLeft;
  }

  if (actionType === 'extra') {
    userUpdates.lastExtraReadAt = now;
    userUpdates.extraChaptersRepaid = (user.extraChaptersRepaid ?? 0) + chaptersToAdd.length;
  }

  const totalChaptersRead = otherBooksChaptersReadTotal + newChaptersRead.length;
  userUpdates.totalProgressPercent = Math.round((totalChaptersRead / TOTAL_BIBLE_CHAPTERS) * 1000) / 10;

  if (user.currentBookId === book.id) {
    if (status === 'completed') {
      const sequence = getPersonalizedSequence(user.roadmapStartTestament ?? 'OT');
      const currentIndex = sequence.findIndex((b) => b.id === book.id);
      const nextBook = sequence[currentIndex + 1];
      if (nextBook) {
        userUpdates.currentBookId = nextBook.id;
        userUpdates.currentTestament = nextBook.testament;
        userUpdates.currentChapter = 0;
        // "함께 읽는 중" 목록/참여인원 수가 지금 그 책을 읽고 있는 사람만 정확히 반영하도록,
        // 완독한 책의 참여기록은 빼고 새 책에만 등록한다(다른 기기에도 onSnapshot으로 실시간 반영됨).
        await Promise.all([
          removeParticipant(book.id, userId),
          joinBookParticipants(nextBook.id, userId, user.nickname),
        ]);
      }
      // 66권 전체 완독(다음 책 없음)은 9단계(onFullBibleCompleted) 범위라 여기서는 그대로 둔다.
    } else {
      userUpdates.currentChapter = newChaptersRead.length;
    }
  }

  await updateUser(userId, userUpdates);

  return { progress, userUpdates };
}

/**
 * 마이페이지 '초기화'(처음부터 다시 읽기). streakDays는 유지하고 그 외 진행 상태는 전부 리셋한다.
 * - 모든 책의 bookProgress 삭제, currentBookId/currentTestament/currentChapter를 본인의 시작 성경(roadmapStartTestament) 1권으로
 * - totalProgressPercent/overdueChapters/extraChaptersRepaid/graceDaysLeft를 가입 시 기본값(0)으로, lastReadAt/lastExtraReadAt은 null로
 * - rereadCount + 1
 * - 진행중이던 책(user.currentBookId)의 참여기록만 제거(다른 책은 정상 진행 중 이미 제거됨)
 */
export async function resetUserProgress(userId: string, user: UserDoc): Promise<void> {
  const firstBook = getPersonalizedSequence(user.roadmapStartTestament ?? 'OT')[0];

  await Promise.all([deleteAllProgress(userId), removeParticipant(user.currentBookId, userId)]);

  await updateUser(userId, {
    currentTestament: firstBook.testament,
    currentBookId: firstBook.id,
    currentChapter: 0,
    totalProgressPercent: 0,
    lastReadAt: null,
    lastExtraReadAt: null,
    overdueChapters: 0,
    extraChaptersRepaid: 0,
    graceDaysLeft: 0,
    rereadCount: user.rereadCount + 1,
  });
}
