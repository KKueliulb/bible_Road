import { collection, doc, getDocs, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ParticipantDoc } from '../types/models';

export interface Participant extends ParticipantDoc {
  userId: string;
}

export async function joinBookParticipants(bookId: string, userId: string, nickname: string): Promise<void> {
  await setDoc(
    doc(db, 'bookParticipants', bookId, 'members', userId),
    { nickname, joinedAt: Date.now() },
    { merge: true }
  );
}

export async function getParticipants(bookId: string): Promise<Participant[]> {
  const snapshot = await getDocs(
    query(collection(db, 'bookParticipants', bookId, 'members'), orderBy('joinedAt'))
  );
  return snapshot.docs.map((docSnap) => ({ userId: docSnap.id, ...(docSnap.data() as ParticipantDoc) }));
}

/** 참여자 목록을 실시간으로 구독한다. 반환값을 호출하면 구독이 해제된다. */
export function subscribeToParticipants(
  bookId: string,
  onChange: (participants: Participant[]) => void
): () => void {
  return onSnapshot(query(collection(db, 'bookParticipants', bookId, 'members'), orderBy('joinedAt')), (snapshot) => {
    onChange(snapshot.docs.map((docSnap) => ({ userId: docSnap.id, ...(docSnap.data() as ParticipantDoc) })));
  });
}
