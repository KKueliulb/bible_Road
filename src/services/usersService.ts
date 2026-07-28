import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { UserDoc } from '../types/models';
import { BOOKS } from '../data/books';

const usersCollection = collection(db, 'users');

export async function isNicknameTaken(nickname: string): Promise<boolean> {
  const snapshot = await getDocs(query(usersCollection, where('nickname', '==', nickname), limit(1)));
  return !snapshot.empty;
}

export async function findUserByNickname(nickname: string): Promise<{ id: string; data: UserDoc } | null> {
  const snapshot = await getDocs(query(usersCollection, where('nickname', '==', nickname), limit(1)));
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, data: docSnap.data() as UserDoc };
}

export async function getUserById(userId: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(usersCollection, userId));
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

export async function createUser(name: string, nickname: string): Promise<{ id: string; data: UserDoc }> {
  const firstBook = BOOKS[0];
  const newDocRef = doc(usersCollection);
  const data: UserDoc = {
    name,
    nickname,
    nicknameChangeCount: 0,
    lastNicknameChangedAt: null,
    currentTestament: firstBook.testament,
    currentBookId: firstBook.id,
    currentChapter: 0,
    totalProgressPercent: 0,
    streakDays: 0,
    lastReadAt: null,
    overdueChapters: 0,
    graceDaysLeft: 0,
    rereadCount: 0,
    fcmToken: null,
    dailyReminderTime: '20:00',
    createdAt: Date.now(),
  };

  await setDoc(newDocRef, data);
  return { id: newDocRef.id, data };
}

export async function updateUser(userId: string, updates: Partial<UserDoc>): Promise<void> {
  await setDoc(doc(usersCollection, userId), updates, { merge: true });
}
