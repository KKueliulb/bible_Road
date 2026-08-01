import { collection, deleteDoc, doc, getDocs, limit, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { GroupDoc, GroupMemberDoc } from '../types/models';

const groupsCollection = collection(db, 'groups');
const groupMembersCollection = collection(db, 'groupMembers');

// 혼동되는 0/O/1/I/L은 제외해 사람이 직접 옮겨 적어도 헷갈리지 않게 한다.
const INVITE_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 6;

export interface Group extends GroupDoc {
  id: string;
}

export interface GroupMembership extends GroupMemberDoc {
  id: string;
}

function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i += 1) {
    code += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)];
  }
  return code;
}

async function isInviteCodeTaken(code: string): Promise<boolean> {
  const snapshot = await getDocs(query(groupsCollection, where('inviteCode', '==', code), limit(1)));
  return !snapshot.empty;
}

function membershipId(groupId: string, userId: string): string {
  return `${groupId}_${userId}`;
}

/** 그룹을 만들고, 만든 사람을 첫 멤버로 자동 가입시킨다. */
export async function createGroup(name: string, ownerId: string, ownerNickname: string): Promise<Group> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('그룹 이름을 입력해주세요.');
  }

  let inviteCode = generateInviteCode();
  // 충돌 확률은 극히 낮지만(문자셋 32개 기준 6자리), 혹시를 대비해 몇 번 재시도한다.
  for (let attempt = 0; attempt < 5 && (await isInviteCodeTaken(inviteCode)); attempt += 1) {
    inviteCode = generateInviteCode();
  }

  const groupRef = doc(groupsCollection);
  const data: GroupDoc = { name: trimmed, inviteCode, ownerId, createdAt: Date.now() };
  await setDoc(groupRef, data);
  await joinGroup(groupRef.id, trimmed, inviteCode, ownerId, ownerNickname);
  return { id: groupRef.id, ...data };
}

export async function findGroupByInviteCode(code: string): Promise<Group | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const snapshot = await getDocs(query(groupsCollection, where('inviteCode', '==', normalized), limit(1)));
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...(docSnap.data() as GroupDoc) };
}

export async function joinGroup(
  groupId: string,
  groupName: string,
  groupInviteCode: string,
  userId: string,
  nickname: string
): Promise<void> {
  const data: GroupMemberDoc = { groupId, groupName, groupInviteCode, userId, nickname, joinedAt: Date.now() };
  await setDoc(doc(groupMembersCollection, membershipId(groupId, userId)), data);
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  await deleteDoc(doc(groupMembersCollection, membershipId(groupId, userId)));
}

/**
 * 내가 속한 그룹 목록을 실시간으로 구독한다. Firestore 복합 색인을 피하려고 where만 걸고
 * 정렬은 클라이언트에서 한다(그룹 개수가 적어 문제 없음).
 */
export function subscribeToUserGroups(userId: string, onChange: (memberships: GroupMembership[]) => void): () => void {
  return onSnapshot(query(groupMembersCollection, where('userId', '==', userId)), (snapshot) => {
    const memberships = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as GroupMemberDoc) }));
    memberships.sort((a, b) => a.joinedAt - b.joinedAt);
    onChange(memberships);
  });
}

/** 특정 그룹의 멤버 userId 집합을 실시간으로 구독한다(로드맵/랭킹 그룹 필터링용). */
export function subscribeToGroupMemberIds(groupId: string, onChange: (userIds: Set<string>) => void): () => void {
  return onSnapshot(query(groupMembersCollection, where('groupId', '==', groupId)), (snapshot) => {
    onChange(new Set(snapshot.docs.map((docSnap) => (docSnap.data() as GroupMemberDoc).userId)));
  });
}
