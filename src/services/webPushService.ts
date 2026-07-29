import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { VAPID_PUBLIC_KEY } from '../constants/webPushConfig';

function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function isWebPushSupported(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window
  );
}

/**
 * 웹(PWA)에서만 동작한다. 알림 권한을 요청하고, 허용되면 Web Push를 구독해서
 * Firestore(`webPushSubscriptions/{userId}`)에 저장한다. Cloudflare Worker가 매일 저녁 8시(KST)에
 * 이 문서들을 보고 그날 안 읽은 사람에게 Web Push를 보낸다. 네이티브(iOS/Android 앱)에서는 아무 것도
 * 하지 않는다 — 거기는 기존 로컬 알림(`refreshDailyReminder`)을 그대로 쓴다.
 */
export async function registerWebPush(userId: string): Promise<void> {
  if (!isWebPushSupported()) return;

  try {
    const registration = await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys) return;

    await setDoc(doc(db, 'webPushSubscriptions', userId), {
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      updatedAt: Date.now(),
    });
  } catch {
    // 웹푸시 등록 실패는 부가 기능이라 조용히 무시
  }
}
