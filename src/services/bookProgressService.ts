import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
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

export async function getBookProgress(userId: string, bookId: string): Promise<BookProgressDoc | null> {
  const snap = await getDoc(doc(db, 'users', userId, 'bookProgress', bookId));
  return snap.exists() ? (snap.data() as BookProgressDoc) : null;
}

export async function saveBookProgress(
  userId: string,
  bookId: string,
  progress: BookProgressDoc
): Promise<void> {
  await setDoc(doc(db, 'users', userId, 'bookProgress', bookId), progress);
}
