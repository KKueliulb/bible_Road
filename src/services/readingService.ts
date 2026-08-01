import { Book } from './booksService';
import { deleteAllProgress, saveBookProgress } from './bookProgressService';
import { joinBookParticipants, removeParticipant } from './participantsService';
import { updateUser } from './usersService';
import { BookSeed, getPersonalizedSequence, TOTAL_BIBLE_CHAPTERS } from '../data/books';
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
 * 유예일수(graceDaysLeft)를 넘도록 계속 안 읽었는지 여부. 이 상태가 되면 다음 "읽었어요!" 때
 * recordChaptersRead가 스트릭을 리셋하고 공백을 원금에 확정하지만, 그 전까지도(사용자가 앱을
 * 다시 열었을 때) 화면에는 이미 끊긴 스트릭/밀린 장수를 실시간으로 보여줘야 해서 별도로 계산한다.
 */
export function isGraceExpired(
  user: Pick<UserDoc, 'lastReadAt' | 'createdAt' | 'graceDaysLeft'>,
  now: number = Date.now()
): boolean {
  return ongoingGapMissedDays(user.lastReadAt, user.createdAt, now) > user.graceDaysLeft;
}

/**
 * 밀린 장수 = 원금(overdueChapters, "읽었어요!"가 공백을 확정할 때만 누적)
 *           + 아직 확정 안 된 진행중 공백(실시간 계산)
 *           - N장 더 읽었어요로 상환한 누적 장수(extraChaptersRepaid).
 *
 * "읽었어요!"는 원금을 절대 깎지 않고(그 자리에서 공백을 새로 확정할 때만 "늘릴" 수 있음),
 * "N장 더 읽었어요!"는 상환액만 늘려서 이 합계를 줄인다 — 그래서 "읽었어요"를 눌러도 이 숫자는 안 바뀐다.
 * 화면을 열 때마다 이 함수로 그 자리에서 다시 계산해야 한다(저장된 값만 보면 액션 없이는 안 늘어난 것처럼 보임).
 *
 * 유예를 넘도록(대개 이틀) 방치하면 스트릭이 이미 끊긴 것으로 보고 밀린 장수 알림도 0으로
 * 표시한다(더 쌓아봐야 어차피 다음 "읽었어요!"에서 스트릭과 함께 정리되기 때문).
 */
export function computeLiveOverdueChapters(
  user: Pick<UserDoc, 'overdueChapters' | 'lastReadAt' | 'createdAt' | 'extraChaptersRepaid' | 'graceDaysLeft'>,
  now: number = Date.now()
): number {
  if (isGraceExpired(user, now)) return 0;
  const ongoingGapChapters = ongoingGapMissedDays(user.lastReadAt, user.createdAt, now) * DAILY_CHAPTER_GOAL;
  const repaid = user.extraChaptersRepaid ?? 0;
  return Math.max(0, user.overdueChapters + ongoingGapChapters - repaid);
}

/** 유예를 넘도록 방치하면 다음에 읽기 전까지는 화면에 스트릭을 0으로 보여준다. */
export function computeLiveStreakDays(
  user: Pick<UserDoc, 'streakDays' | 'lastReadAt' | 'createdAt' | 'graceDaysLeft'>,
  now: number = Date.now()
): number {
  return isGraceExpired(user, now) ? 0 : user.streakDays;
}

export interface GoalSegment {
  bookId: string;
  bookName: string;
  start: number;
  end: number;
}

/** sequence(개인화된 진행 순서)에서 bookId 앞에 있는 모든 책의 장수 합. */
function cumulativeChaptersBefore(sequence: BookSeed[], bookId: string): number {
  let sum = 0;
  for (const b of sequence) {
    if (b.id === bookId) return sum;
    sum += b.totalChapters;
  }
  return sum;
}

/**
 * "오늘의 목표"로 표시할 구간(책 하나 이상에 걸칠 수 있음). 지금 책에 남은 장수가
 * DAILY_CHAPTER_GOAL보다 적으면, 목표 구간이 다음 책 앞부분까지 이어져서 표시된다
 * (예: 창세기 50장, 출애굽기 1장~2장) — recordChaptersRead의 실제 롤오버 저장 로직과
 * 같은 계산(전체 시퀀스를 한 줄로 이어붙인 "전역 장 위치")을 써서 항상 일치하도록 한다.
 *
 * 오늘 "읽었어요!"를 이미 눌렀으면(readToday) 방금 끝낸 구간을 그대로 유지하고, 다음 날이
 * 되어야 다음 구간으로 넘어간다 — 그렇지 않으면 누르자마자 화면이 곧바로 다음 구간으로
 * 넘어가버려서 마치 오늘 목표를 아직 안 채운 것처럼 보이는 문제가 있었다.
 */
export function computeTodayGoalSegments(
  sequence: BookSeed[],
  currentBookId: string,
  chaptersReadCount: number,
  readToday: boolean
): GoalSegment[] {
  const totalSequenceChapters = sequence.reduce((sum, b) => sum + b.totalChapters, 0);
  const currentGlobalPosition = cumulativeChaptersBefore(sequence, currentBookId) + chaptersReadCount;
  const baseline = readToday ? Math.max(0, currentGlobalPosition - DAILY_CHAPTER_GOAL) : currentGlobalPosition;
  const target = Math.min(baseline + DAILY_CHAPTER_GOAL, totalSequenceChapters);

  const segments: GoalSegment[] = [];
  let offset = 0;
  for (const book of sequence) {
    const bookStartGlobal = offset;
    const bookEndGlobal = offset + book.totalChapters;
    offset = bookEndGlobal;
    if (bookEndGlobal <= baseline) continue;
    if (bookStartGlobal >= target) break;

    const start = Math.max(baseline, bookStartGlobal) - bookStartGlobal + 1;
    const end = Math.min(target, bookEndGlobal) - bookStartGlobal;
    if (end >= start) {
      segments.push({ bookId: book.id, bookName: book.name, start, end });
    }
  }
  return segments;
}

/** GoalSegment[]를 "창세기 50장, 출애굽기 1장~2장" 형식의 문자열로 합친다. */
export function formatGoalSegments(segments: GoalSegment[]): string {
  return segments
    .map((seg) => (seg.start === seg.end ? `${seg.bookName} ${seg.end}장` : `${seg.bookName} ${seg.start}장~${seg.end}장`))
    .join(', ');
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

interface TouchedBook {
  book: Book;
  progress: BookProgressDoc;
  chaptersAdded: number;
}

/**
 * "읽었어요!" / "N장 더 읽었어요!" 공용 로직.
 * 설계문서에 스트릭/유예/밀린 장수의 정확한 계산식이 없어 아래 규칙으로 구현함(추후 9단계 Cloud Functions에서 보완 가능):
 * - streakDays/lastReadAt/graceDaysLeft/overdueChapters(원금)는 'base' 액션에서만 갱신된다(유저 전역 기준).
 * - lastExtraReadAt/extraChaptersRepaid는 'extra' 액션 전용 — "읽었어요"를 눌렀다고 "N장 더 읽었어요"가
 *   하루치 다 쓴 걸로 처리되지도, 밀린 장수가 줄어들지도 않는다.
 * - 책을 완독하면 그 책이 currentBookId였을 때만 다음 책으로 자동 이동(그렇지 않으면 로드맵에서 다음 책이 영원히 잠겨 있게 됨)
 * - "읽었어요!"(actionType 'base')이면서 지금 진행중인 책(currentBookId)일 때만, 목표 장수가 책 끝을
 *   넘어가면 남은 만큼 다음 책(들)으로 이어서 채운다("롤오버"). 1장짜리 책이 연달아 있으면 한 번에
 *   여러 책을 완독할 수도 있어 while 루프로 처리한다. "N장 더 읽었어요!"는 애초에 호출부(ReadingScreen)가
 *   선택 가능한 장수를 책에 남은 만큼으로 제한해두므로 롤오버가 필요 없다.
 */
export async function recordChaptersRead(params: RecordReadingParams): Promise<RecordReadingResult> {
  const { userId, user, book, existingProgress, chapterCount, actionType, otherBooksChaptersReadTotal } = params;

  const isCurrentBook = user.currentBookId === book.id;
  const allowRollover = actionType === 'base' && isCurrentBook;
  const sequence = getPersonalizedSequence(user.roadmapStartTestament ?? 'OT');

  const touched: TouchedBook[] = [];
  let remainingGoal = chapterCount;
  let cursorBook: Book = book;
  let cursorExisting: BookProgressDoc | null = existingProgress;
  let sequenceIndex = sequence.findIndex((b) => b.id === book.id);

  while (remainingGoal > 0) {
    const currentChaptersRead = cursorExisting?.chaptersRead ?? [];
    const alreadyReadCount = currentChaptersRead.length;
    const toAddCount = Math.min(remainingGoal, cursorBook.totalChapters - alreadyReadCount);
    const nextStart = alreadyReadCount + 1;
    const nextEnd = alreadyReadCount + toAddCount;

    const chaptersToAdd: number[] = [];
    for (let chapter = nextStart; chapter <= nextEnd; chapter += 1) {
      chaptersToAdd.push(chapter);
    }

    const newChaptersRead = [...currentChaptersRead, ...chaptersToAdd];
    const status = newChaptersRead.length >= cursorBook.totalChapters ? 'completed' : 'in_progress';
    const progress: BookProgressDoc = {
      chaptersRead: newChaptersRead,
      status,
      completedAt: status === 'completed' ? cursorExisting?.completedAt ?? Date.now() : null,
    };

    touched.push({ book: cursorBook, progress, chaptersAdded: toAddCount });
    remainingGoal -= toAddCount;

    if (remainingGoal <= 0 || status !== 'completed' || !allowRollover) break;

    const nextBook = sequence[sequenceIndex + 1];
    if (!nextBook) break; // 시퀀스 끝(66권 전체 완독) - 새 회독으로 넘기지 않고 여기서 멈춘다
    sequenceIndex += 1;
    cursorBook = nextBook;
    cursorExisting = null; // 다음 책은 항상 진행 기록이 없는(잠긴) 상태에서 시작한다
  }

  await Promise.all(touched.map(({ book: b, progress }) => saveBookProgress(userId, b.id, progress)));

  const firstTouched = touched[0];
  const lastTouched = touched[touched.length - 1];
  const totalChaptersAdded = touched.reduce((sum, t) => sum + t.chaptersAdded, 0);

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
    userUpdates.extraChaptersRepaid = (user.extraChaptersRepaid ?? 0) + totalChaptersAdded;
  }

  const totalChaptersReadOverall =
    otherBooksChaptersReadTotal + touched.reduce((sum, t) => sum + t.progress.chaptersRead.length, 0);
  userUpdates.totalProgressPercent = Math.round((totalChaptersReadOverall / TOTAL_BIBLE_CHAPTERS) * 1000) / 10;

  if (isCurrentBook) {
    if (lastTouched.progress.status === 'completed') {
      const lastIndex = sequence.findIndex((b) => b.id === lastTouched.book.id);
      const nextBook = sequence[lastIndex + 1];
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
      } else {
        // 66권 전체 완독 - 연속 스트릭(streakDays/lastReadAt)만 남기고 나머지 진행 상황을 전부 초기화한
        // 뒤 자동으로 다음 회독을 시작하고 회독수(rereadCount)를 올린다.
        const firstBook = sequence[0];
        userUpdates.currentBookId = firstBook.id;
        userUpdates.currentTestament = firstBook.testament;
        userUpdates.currentChapter = 0;
        userUpdates.totalProgressPercent = 0;
        userUpdates.overdueChapters = 0;
        userUpdates.extraChaptersRepaid = 0;
        userUpdates.graceDaysLeft = 2;
        userUpdates.rereadCount = user.rereadCount + 1;
        await Promise.all([
          removeParticipant(book.id, userId),
          deleteAllProgress(userId),
          joinBookParticipants(firstBook.id, userId, user.nickname),
        ]);
      }
    } else {
      userUpdates.currentChapter = lastTouched.progress.chaptersRead.length;
      if (lastTouched.book.id !== book.id) {
        // 이번 액션에서 다음 책으로 롤오버됐지만(원래 책은 완독) 새 책은 아직 다 못 채운 경우.
        userUpdates.currentBookId = lastTouched.book.id;
        userUpdates.currentTestament = lastTouched.book.testament;
        await Promise.all([
          removeParticipant(book.id, userId),
          joinBookParticipants(lastTouched.book.id, userId, user.nickname),
        ]);
      }
    }
  }

  await updateUser(userId, userUpdates);

  return { progress: firstTouched.progress, userUpdates };
}
