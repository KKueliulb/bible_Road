import { buildPushPayload, type PushSubscription, type VapidKeys } from '@block65/webcrypto-web-push';
import { getFirestoreAccessToken } from './googleAuth';
import { createFirestoreClient, type FirestoreClient } from './firestore';
import { hasReadTodayKst, kstDateKey } from './hasReadToday';

export interface Env {
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
}

const REMINDER_MESSAGE = {
  title: 'Bible Road',
  body: '아직 말씀을 읽지 않으셨네요? 지금 읽어볼까요? 🔥',
};

type ReminderSlot = 'morning' | 'evening';

// wrangler.toml의 crons 배열과 1:1로 대응한다. 어느 크론이 실행됐는지 event.cron으로 구분한다.
const MORNING_CRON = '0 23 * * *'; // 08:00 KST(다음날)
const EVENING_CRON = '0 11 * * *'; // 20:00 KST

// 다른 사용자를 지목해 콕 찌르는 즉시 알림 발송용 엔드포인트라, 앱과 다른 오리진(워커 URL)에서
// fetch로 호출된다. 그래서 CORS 헤더가 필요하다.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const slot: ReminderSlot = event.cron === MORNING_CRON ? 'morning' : 'evening';
    ctx.waitUntil(sendDailyReminders(env, slot));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method === 'POST' && url.pathname === '/poke') {
      return handlePoke(request, env);
    }

    // 그 외 요청(주로 GET)은 npm run trigger 같은 수동 테스트용 — ?slot=morning|evening 으로 어느
    // 시간대 발송인지 지정할 수 있고, 생략하면 저녁(기존 기본 동작)으로 처리한다.
    const slot: ReminderSlot = url.searchParams.get('slot') === 'morning' ? 'morning' : 'evening';
    const result = await sendDailyReminders(env, slot);
    return Response.json({ slot, ...result });
  },
};

async function getVapidAndFirestore(env: Env): Promise<{ firestore: FirestoreClient; vapid: VapidKeys }> {
  const accessToken = await getFirestoreAccessToken(env.FIREBASE_CLIENT_EMAIL, env.FIREBASE_PRIVATE_KEY);
  return {
    firestore: createFirestoreClient(env.FIREBASE_PROJECT_ID, accessToken),
    vapid: { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY },
  };
}

/** 구독 하나에 실제로 푸시를 발송한다. 만료된 구독(404/410)은 호출한 쪽에서 정리하도록 상태를 반환한다. */
async function sendPushToSubscription(
  endpoint: string,
  keys: { p256dh: string; auth: string },
  message: { title: string; body: string },
  vapid: VapidKeys
): Promise<'sent' | 'expired' | 'failed'> {
  const pushSubscription: PushSubscription = { endpoint, expirationTime: null, keys };
  try {
    const payload = await buildPushPayload({ data: message, options: { ttl: 60 * 60 * 24 } }, pushSubscription, vapid);
    const response = await fetch(endpoint, { method: payload.method, headers: payload.headers, body: payload.body });
    if (response.status === 404 || response.status === 410) return 'expired';
    return response.ok ? 'sent' : 'failed';
  } catch {
    return 'failed';
  }
}

async function sendDailyReminders(
  env: Env,
  slot: ReminderSlot
): Promise<{ checked: number; sent: number; skipped: number; removed: number }> {
  const { firestore, vapid } = await getVapidAndFirestore(env);
  const subscriptions = await firestore.listDocuments('webPushSubscriptions');
  // Cloudflare Cron Trigger는 "최소 1회" 실행만 보장하고 드물게 같은 슬롯이 중복 실행될 수 있다.
  // 그래도 유저에게는 슬롯당 하루 최대 1회만 가도록, 이번 실행의 "날짜+슬롯" 키를 구독 문서에
  // 남겨두고 이미 같은 키로 보낸 적 있으면 건너뛴다(동시에 중복 실행되는 극단적인 경우까지 막는
  // 엄밀한 락은 아니고, 순차적인 재시도 케이스를 막는 best-effort 장치다).
  const reminderKey = `${kstDateKey()}-${slot}`;

  let sent = 0;
  let skipped = 0;
  let removed = 0;

  await Promise.all(
    subscriptions.map(async ({ id: userId, data }) => {
      const endpoint = data.endpoint as string | undefined;
      const keys = data.keys as { p256dh?: string; auth?: string } | undefined;
      if (!endpoint || !keys?.p256dh || !keys?.auth) return;

      if (data.lastReminderKey === reminderKey) {
        skipped++;
        return;
      }

      const user = await firestore.getDocument('users', userId);
      if (!user) return;

      // reminderSchedule이 없는(마이그레이션 이전) 유저는 기존 기본값인 저녁으로 취급한다.
      const schedule = (user.reminderSchedule as string | undefined) ?? 'evening';
      if (schedule !== 'both' && schedule !== slot) return;

      const lastReadAt = (user.lastReadAt as number | null) ?? null;
      if (hasReadTodayKst(lastReadAt)) return;

      const result = await sendPushToSubscription(endpoint, { p256dh: keys.p256dh, auth: keys.auth }, REMINDER_MESSAGE, vapid);
      if (result === 'expired') {
        await firestore.deleteDocument('webPushSubscriptions', userId);
        removed++;
      } else if (result === 'sent') {
        sent++;
        await firestore.updateDocument('webPushSubscriptions', userId, { lastReminderKey: reminderKey });
      }
    })
  );

  return { checked: subscriptions.length, sent, skipped, removed };
}

async function handlePoke(request: Request, env: Env): Promise<Response> {
  let body: { fromNickname?: string; toUserId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400, headers: CORS_HEADERS });
  }

  const fromNickname = body.fromNickname?.trim();
  const toUserId = body.toUserId?.trim();
  if (!fromNickname || !toUserId) {
    return Response.json({ error: 'missing_fields' }, { status: 400, headers: CORS_HEADERS });
  }

  const { firestore, vapid } = await getVapidAndFirestore(env);
  const subscription = await firestore.getDocument('webPushSubscriptions', toUserId);
  const endpoint = subscription?.endpoint as string | undefined;
  const keys = subscription?.keys as { p256dh?: string; auth?: string } | undefined;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return Response.json({ delivered: false, reason: 'no_subscription' }, { headers: CORS_HEADERS });
  }

  const message = {
    title: '콕콕! 👉',
    body: `${fromNickname}님이 같이 읽재요!`,
  };

  const result = await sendPushToSubscription(endpoint, { p256dh: keys.p256dh, auth: keys.auth }, message, vapid);
  if (result === 'expired') {
    await firestore.deleteDocument('webPushSubscriptions', toUserId);
    return Response.json({ delivered: false, reason: 'expired' }, { headers: CORS_HEADERS });
  }

  return Response.json({ delivered: result === 'sent' }, { headers: CORS_HEADERS });
}
