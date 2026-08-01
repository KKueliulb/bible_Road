import { buildPushPayload, type PushSubscription, type VapidKeys } from '@block65/webcrypto-web-push';
import { getFirestoreAccessToken } from './googleAuth';
import { createFirestoreClient, type FirestoreClient } from './firestore';
import { hasReadTodayKst } from './hasReadToday';

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

// 다른 사용자를 지목해 콕 찌르는 즉시 알림 발송용 엔드포인트라, 앱과 다른 오리진(워커 URL)에서
// fetch로 호출된다. 그래서 CORS 헤더가 필요하다.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(sendDailyReminders(env));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method === 'POST' && url.pathname === '/poke') {
      return handlePoke(request, env);
    }

    // 그 외 요청(주로 GET)은 npm run trigger 같은 수동 테스트용 — 매일 저녁 발송 로직을 그대로 실행한다.
    const result = await sendDailyReminders(env);
    return Response.json(result);
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

async function sendDailyReminders(env: Env): Promise<{ checked: number; sent: number; removed: number }> {
  const { firestore, vapid } = await getVapidAndFirestore(env);
  const subscriptions = await firestore.listDocuments('webPushSubscriptions');

  let sent = 0;
  let removed = 0;

  await Promise.all(
    subscriptions.map(async ({ id: userId, data }) => {
      const endpoint = data.endpoint as string | undefined;
      const keys = data.keys as { p256dh?: string; auth?: string } | undefined;
      if (!endpoint || !keys?.p256dh || !keys?.auth) return;

      const user = await firestore.getDocument('users', userId);
      if (!user) return;

      const lastReadAt = (user.lastReadAt as number | null) ?? null;
      if (hasReadTodayKst(lastReadAt)) return;

      const result = await sendPushToSubscription(endpoint, { p256dh: keys.p256dh, auth: keys.auth }, REMINDER_MESSAGE, vapid);
      if (result === 'expired') {
        await firestore.deleteDocument('webPushSubscriptions', userId);
        removed++;
      } else if (result === 'sent') {
        sent++;
      }
    })
  );

  return { checked: subscriptions.length, sent, removed };
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
    title: 'Bible Road',
    body: `콕콕! 👉 ${fromNickname}님이 같이 읽재요!`,
  };

  const result = await sendPushToSubscription(endpoint, { p256dh: keys.p256dh, auth: keys.auth }, message, vapid);
  if (result === 'expired') {
    await firestore.deleteDocument('webPushSubscriptions', toUserId);
    return Response.json({ delivered: false, reason: 'expired' }, { headers: CORS_HEADERS });
  }

  return Response.json({ delivered: result === 'sent' }, { headers: CORS_HEADERS });
}
