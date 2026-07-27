import { collection, doc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';
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
