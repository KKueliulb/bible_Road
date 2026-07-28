import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function cheerLogId(fromUserId: string, toUserId: string): string {
  return `${fromUserId}_${toUserId}_${todayKey()}`;
}

export async function hasCheeredToday(fromUserId: string, toUserId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'cheerLogs', cheerLogId(fromUserId, toUserId)));
  return snap.exists();
}

export async function sendCheer(fromUserId: string, toUserId: string): Promise<void> {
  await setDoc(doc(db, 'cheerLogs', cheerLogId(fromUserId, toUserId)), { sentAt: Date.now() });
}
