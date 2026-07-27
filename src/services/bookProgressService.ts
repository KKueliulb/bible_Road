import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { BookProgressDoc } from '../types/models';

export async function getBookProgressMap(userId: string): Promise<Record<string, BookProgressDoc>> {
  const snapshot = await getDocs(collection(db, 'users', userId, 'bookProgress'));
  const map: Record<string, BookProgressDoc> = {};
  snapshot.docs.forEach((docSnap) => {
    map[docSnap.id] = docSnap.data() as BookProgressDoc;
  });
  return map;
}
