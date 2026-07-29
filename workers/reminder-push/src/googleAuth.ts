/**
 * Firebase 서비스 계정(Firebase 콘솔 > 프로젝트 설정 > 서비스 계정에서 발급)의 client_email/private_key로
 * Firestore REST API를 호출할 수 있는 Google OAuth2 액세스 토큰을 발급받는다. firebase-admin은 Node
 * 전용이라 Workers에서 못 쓰기 때문에, 같은 일을 Web Crypto로 직접 구현한다.
 */

function base64UrlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const buf = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const byte of buf) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleaned = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/** 서비스 계정 private_key(PEM, `\n`이 문자 그대로 들어있을 수 있음)로 signing용 CryptoKey를 만든다. */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const normalizedPem = pem.replace(/\\n/g, '\n');
  const keyData = pemToArrayBuffer(normalizedPem);
  return crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

/** `datastore` 스코프로 Firestore 읽기/쓰기가 가능한 액세스 토큰을 발급받는다(1시간 유효). */
export async function getFirestoreAccessToken(
  clientEmail: string,
  privateKeyPem: string
): Promise<string> {
  const key = await importPrivateKey(privateKeyPem);

  const nowSeconds = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  };

  const encoder = new TextEncoder();
  const unsigned =
    base64UrlEncode(encoder.encode(JSON.stringify(header))) +
    '.' +
    base64UrlEncode(encoder.encode(JSON.stringify(claims)));

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(unsigned)
  );
  const jwt = unsigned + '.' + base64UrlEncode(signature);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google OAuth2 토큰 발급 실패: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}
