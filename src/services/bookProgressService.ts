import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
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

/** 유저의 모든 책 진행 기록을 삭제한다 (마이페이지 '초기화' 전용). */
export async function deleteAllProgress(userId: string): Promise<void> {
  const snapshot = await getDocs(collection(db, 'users', userId, 'bookProgress'));
  await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
}
