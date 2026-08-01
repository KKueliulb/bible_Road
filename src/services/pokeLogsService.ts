import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function pokeLogId(fromUserId: string, toUserId: string): string {
  return `${fromUserId}_${toUserId}_${todayKey()}`;
}

export async function hasPokedToday(fromUserId: string, toUserId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'pokeLogs', pokeLogId(fromUserId, toUserId)));
  return snap.exists();
}

export async function logPoke(fromUserId: string, toUserId: string): Promise<void> {
  await setDoc(doc(db, 'pokeLogs', pokeLogId(fromUserId, toUserId)), {
    fromUserId,
    toUserId,
    dateKey: todayKey(),
    sentAt: Date.now(),
  });
}
