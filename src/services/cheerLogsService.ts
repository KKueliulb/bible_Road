import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function cheerLogId(fromUserId: string, toUserId: string): string {
  return `${fromUserId}_${toUserId}_${todayKey()}`;
}

export interface ReceivedCheer {
  id: string;
  fromUserId: string;
  fromNickname: string;
}

export async function hasCheeredToday(fromUserId: string, toUserId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'cheerLogs', cheerLogId(fromUserId, toUserId)));
  return snap.exists();
}

export async function sendCheer(fromUserId: string, fromNickname: string, toUserId: string): Promise<void> {
  await setDoc(doc(db, 'cheerLogs', cheerLogId(fromUserId, toUserId)), {
    fromUserId,
    fromNickname,
    toUserId,
    dateKey: todayKey(),
    sentAt: Date.now(),
  });
}

/** 오늘 나에게 온 화이팅 목록을 조회한다(등호 조건만 있어 복합 색인 없이 동작한다). */
export async function getCheersReceivedToday(userId: string): Promise<ReceivedCheer[]> {
  const snapshot = await getDocs(
    query(collection(db, 'cheerLogs'), where('toUserId', '==', userId), where('dateKey', '==', todayKey()))
  );
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      fromUserId: data.fromUserId as string,
      fromNickname: data.fromNickname as string,
    };
  });
}
