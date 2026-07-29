// Web Push용 VAPID 공개키. 개인키는 Cloudflare Worker 쪽에만 시크릿으로 보관하고, 이 공개키만
// 클라이언트에 노출한다(원래 공개해도 안전한 값).
export const VAPID_PUBLIC_KEY =
  'BExVP0cVjflfcYwwC3UtnUtQqCBIUtjTSzifP-aU2raT9mdOD23kKy8b9oMovDsmx04zI9QSG1y2ZoGnC5kr57s';
