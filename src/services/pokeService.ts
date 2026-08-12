import { REMINDER_WORKER_URL } from '../constants/webPushConfig';

export interface SendPokeResult {
  delivered: boolean;
  reason?: string;
}

/** 상대방에게 "콕 찌르기" 웹푸시를 즉시 보낸다. 상대가 웹푸시 구독 중이 아니면 delivered: false. */
export async function sendPokePush(fromNickname: string, toUserId: string): Promise<SendPokeResult> {
  const response = await fetch(`${REMINDER_WORKER_URL}/poke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromNickname, toUserId }),
  });
  if (!response.ok) {
    throw new Error(`찌르기 전송 실패: ${response.status}`);
  }
  return (await response.json()) as SendPokeResult;
}
