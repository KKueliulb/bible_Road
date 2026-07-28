import { collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { Testament, UserDoc } from '../types/models';
import { BOOKS, getPersonalizedSequence } from '../data/books';
import { NICKNAME_CHANGE_LIMIT } from '../constants/profileConfig';

const usersCollection = collection(db, 'users');

export interface RankingEntry {
  userId: string;
  nickname: string;
  totalProgressPercent: number;
  photoURL: string | null;
}

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
    lastExtraReadAt: null,
    overdueChapters: 0,
    extraChaptersRepaid: 0,
    graceDaysLeft: 0,
    rereadCount: 0,
    roadmapStartTestament: 'OT',
    hasOnboarded: false,
    photoURL: null,
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

/** 온보딩에서 고른 시작 성경을 반영해 로드맵 진행 순서/현재 책을 설정하고 온보딩을 완료 처리한다. */
export async function completeOnboarding(userId: string, startTestament: Testament): Promise<void> {
  const firstBook = getPersonalizedSequence(startTestament)[0];
  await updateUser(userId, {
    roadmapStartTestament: startTestament,
    hasOnboarded: true,
    currentTestament: firstBook.testament,
    currentBookId: firstBook.id,
    currentChapter: 0,
  });
}

/** 총 진행률(totalProgressPercent) 내림차순 랭킹을 실시간으로 구독한다. 반환값을 호출하면 구독이 해제된다. */
export function subscribeToRanking(onChange: (ranking: RankingEntry[]) => void): () => void {
  return onSnapshot(query(usersCollection, orderBy('totalProgressPercent', 'desc')), (snapshot) => {
    onChange(
      snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as UserDoc;
        return {
          userId: docSnap.id,
          nickname: data.nickname,
          totalProgressPercent: data.totalProgressPercent,
          photoURL: data.photoURL ?? null,
        };
      })
    );
  });
}

type NicknameChangeResult = { ok: true } | { ok: false; error: string };

/** 닉네임 변경. 평생 NICKNAME_CHANGE_LIMIT회까지만 허용된다. */
export async function changeNickname(
  userId: string,
  currentChangeCount: number,
  newNickname: string
): Promise<NicknameChangeResult> {
  const trimmed = newNickname.trim();
  if (!trimmed) {
    return { ok: false, error: '닉네임을 입력해주세요.' };
  }
  if (currentChangeCount >= NICKNAME_CHANGE_LIMIT) {
    return { ok: false, error: '닉네임 변경 가능 횟수를 모두 사용했어요.' };
  }
  if (await isNicknameTaken(trimmed)) {
    return { ok: false, error: '이미 사용 중인 닉네임입니다.' };
  }

  await updateUser(userId, {
    nickname: trimmed,
    nicknameChangeCount: currentChangeCount + 1,
    lastNicknameChangedAt: Date.now(),
  });
  return { ok: true };
}
