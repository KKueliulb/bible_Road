// Cloudflare Workers 런타임은 Date의 로컬 시간대를 UTC로 취급하기 때문에(고정된 지역이 없어서),
// 앱(한국 사용자 기기, KST)과 같은 기준으로 "오늘"을 판단하려면 KST로 직접 변환해서 날짜를 비교해야
// 한다. 앱 쪽 `readingService.ts`의 `hasReadToday`와 같은 개념이지만, KST 고정 오프셋을 명시적으로 쓴다.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function kstDateOnly(ms: number): number {
  const shifted = new Date(ms + KST_OFFSET_MS);
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
}

export function hasReadTodayKst(lastReadAt: number | null, nowMs: number = Date.now()): boolean {
  if (lastReadAt === null) return false;
  return kstDateOnly(lastReadAt) === kstDateOnly(nowMs);
}

/** KST 기준 오늘 날짜를 "YYYY-MM-DD"로 반환한다(리마인더 중복 발송 방지 키에 사용). */
export function kstDateKey(nowMs: number = Date.now()): string {
  const shifted = new Date(nowMs + KST_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
