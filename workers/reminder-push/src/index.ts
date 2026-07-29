import { buildPushPayload, type PushSubscription, type VapidKeys } from '@block65/webcrypto-web-push';
import { getFirestoreAccessToken } from './googleAuth';
import { createFirestoreClient } from './firestore';
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

export default {
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(sendDailyReminders(env));
  },

  // wrangler dev로 수동 트리거해 테스트할 수 있도록 fetch 핸들러도 열어둔다.
  async fetch(_request: Request, env: Env): Promise<Response> {
    const result = await sendDailyReminders(env);
    return Response.json(result);
  },
};

async function sendDailyReminders(env: Env): Promise<{ checked: number; sent: number; removed: number }> {
  const accessToken = await getFirestoreAccessToken(env.FIREBASE_CLIENT_EMAIL, env.FIREBASE_PRIVATE_KEY);
  const firestore = createFirestoreClient(env.FIREBASE_PROJECT_ID, accessToken);

  const vapid: VapidKeys = {
    subject: env.VAPID_SUBJECT,
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
  };

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

      const pushSubscription: PushSubscription = {
        endpoint,
        expirationTime: null,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
      };

      try {
        const payload = await buildPushPayload(
          { data: REMINDER_MESSAGE, options: { ttl: 60 * 60 * 24 } },
          pushSubscription,
          vapid
        );
        const response = await fetch(endpoint, {
          method: payload.method,
          headers: payload.headers,
          body: payload.body,
        });

        if (response.status === 404 || response.status === 410) {
          // 구독이 브라우저에서 이미 만료/삭제됨 → Firestore에서도 정리
          await firestore.deleteDocument('webPushSubscriptions', userId);
          removed++;
          return;
        }
        if (response.ok) sent++;
      } catch {
        // 개별 발송 실패는 조용히 넘어가고 다음 사람 계속 처리
      }
    })
  );

  return { checked: subscriptions.length, sent, removed };
}
