import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

initializeApp();
const db = getFirestore();

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 이 앱은 교회 청년부(한국) 대상이라 시간대를 KST(UTC+9) 하나로 고정한다. 서버 실행 환경의
 * 로컬 타임존에 의존하지 않도록, epoch ms에 오프셋을 더한 뒤 UTC 게터로 읽는다.
 */
function kstDateKey(ms: number): string {
  return new Date(ms + KST_OFFSET_MS).toISOString().slice(0, 10);
}

function hasReadTodayKst(lastReadAt: number | null, now: number): boolean {
  if (lastReadAt === null) return false;
  return kstDateKey(lastReadAt) === kstDateKey(now);
}

/** 지금 KST 기준 시각을 30분 단위로 내림한 "HH:mm" 문자열로 반환한다 (예: 20:07 → "20:00"). */
function currentKstHalfHourSlot(now: number): string {
  const kst = new Date(now + KST_OFFSET_MS);
  const hours = kst.getUTCHours();
  const slotMinutes = kst.getUTCMinutes() < 30 ? 0 : 30;
  return `${String(hours).padStart(2, '0')}:${String(slotMinutes).padStart(2, '0')}`;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound?: 'default';
}

/** Expo Push API로 알림을 보낸다. 한 요청에 너무 많이 담지 않도록 100개씩 나눠 보낸다. */
async function sendExpoPushMessages(messages: ExpoPushMessage[]): Promise<void> {
  const CHUNK_SIZE = 100;
  const chunks: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
    chunks.push(messages.slice(i, i + CHUNK_SIZE));
  }

  await Promise.all(
    chunks.map((chunk) =>
      fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(chunk),
      })
    )
  );
}

/**
 * 30분마다 실행되어, 지금 시각(KST, 30분 단위)이 dailyReminderTime과 일치하고 오늘 아직
 * "읽었어요!"를 안 누른 유저에게 리마인더 푸시를 보낸다.
 */
export const sendDailyReminders = onSchedule('every 30 minutes', async () => {
  const now = Date.now();
  const slot = currentKstHalfHourSlot(now);

  const snapshot = await db.collection('users').where('dailyReminderTime', '==', slot).get();

  const messages: ExpoPushMessage[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const expoPushToken = data.expoPushToken as string | null | undefined;
    if (!expoPushToken) return;
    if (hasReadTodayKst(data.lastReadAt ?? null, now)) return;

    messages.push({
      to: expoPushToken,
      title: '성경 통독 로드',
      body: '오늘의 목표를 아직 다 못 채우셨어요! 지금 읽어볼까요? 🔥',
      sound: 'default',
    });
  });

  await sendExpoPushMessages(messages);
});

/**
 * cheerLogs/{fromUserId_toUserId_date} 문서가 생성되면(화이팅 보내기) 받는 사람에게 푸시를 보낸다.
 */
export const sendCheerNotification = onDocumentCreated('cheerLogs/{cheerId}', async (event) => {
  const [fromUserId, toUserId] = event.params.cheerId.split('_');
  if (!fromUserId || !toUserId) return;

  const [fromSnap, toSnap] = await Promise.all([
    db.collection('users').doc(fromUserId).get(),
    db.collection('users').doc(toUserId).get(),
  ]);

  const expoPushToken = toSnap.data()?.expoPushToken as string | null | undefined;
  if (!expoPushToken) return;

  const fromNickname = (fromSnap.data()?.nickname as string | undefined) ?? '누군가';

  await sendExpoPushMessages([
    {
      to: expoPushToken,
      title: '화이팅! 💪',
      body: `${fromNickname}님이 화이팅을 보냈어요!`,
      sound: 'default',
    },
  ]);
});
