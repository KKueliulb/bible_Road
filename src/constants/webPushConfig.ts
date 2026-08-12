// Web Push용 VAPID 공개키. 개인키는 Cloudflare Worker 쪽에만 시크릿으로 보관하고, 이 공개키만
// 클라이언트에 노출한다(원래 공개해도 안전한 값).
export const VAPID_PUBLIC_KEY =
  'BExVP0cVjflfcYwwC3UtnUtQqCBIUtjTSzifP-aU2raT9mdOD23kKy8b9oMovDsmx04zI9QSG1y2ZoGnC5kr57s';

// 찌르기(즉시 알림) 발송을 처리하는 Cloudflare Worker 주소. 매일 리마인더를 보내는 것과
// 같은 워커다(workers/reminder-push).
export const REMINDER_WORKER_URL = 'https://bible-road-reminder-push.bibleroad.workers.dev';
