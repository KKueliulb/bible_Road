/**
 * 가입된 유저와 관련 데이터를 모두 삭제하는 초기화 스크립트.
 *
 * 삭제 대상: users/{userId} + users/{userId}/bookProgress, bookParticipants/{bookId}/members,
 * cheerLogs, pokeLogs, webPushSubscriptions 전체. (books 컬렉션은 건드리지 않습니다.)
 *
 * ⚠️ 되돌릴 수 없습니다. 실 서비스 데이터에 실행하기 전에 정말 지워도 되는지 확인하세요.
 *
 * 사용법:
 * 1. Firebase 콘솔 > 프로젝트 설정 > 서비스 계정에서 비공개 키(JSON)를 발급받아
 *    저장소 루트에 serviceAccountKey.json 으로 저장 (git에 커밋하지 말 것, .gitignore에 포함됨)
 * 2. npm run reset:users 실행
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  initializeApp,
  cert,
  getApps,
  type ServiceAccount,
} from 'firebase-admin/app';
import { getFirestore, type CollectionReference } from 'firebase-admin/firestore';
import { BOOKS } from '../data/books';

const SERVICE_ACCOUNT_PATH = path.resolve(process.cwd(), 'serviceAccountKey.json');

if (!existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(
    `serviceAccountKey.json을 찾을 수 없습니다. Firebase 콘솔 > 프로젝트 설정 > 서비스 계정에서 발급받아 저장소 루트에 저장해주세요. (경로: ${SERVICE_ACCOUNT_PATH})`
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8')) as ServiceAccount;

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const BATCH_SIZE = 400;

async function deleteCollection(collectionRef: CollectionReference): Promise<number> {
  const snapshot = await collectionRef.get();
  let deleted = 0;

  for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
    const chunk = snapshot.docs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    chunk.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += chunk.length;
  }

  return deleted;
}

async function resetUsers() {
  const usersSnapshot = await db.collection('users').get();
  let deletedUsers = 0;
  let deletedBookProgress = 0;

  for (const userDoc of usersSnapshot.docs) {
    deletedBookProgress += await deleteCollection(userDoc.ref.collection('bookProgress'));
    await userDoc.ref.delete();
    deletedUsers += 1;
  }

  let deletedParticipants = 0;
  for (const book of BOOKS) {
    deletedParticipants += await deleteCollection(
      db.collection('bookParticipants').doc(book.id).collection('members')
    );
  }

  const deletedCheerLogs = await deleteCollection(db.collection('cheerLogs'));
  const deletedPokeLogs = await deleteCollection(db.collection('pokeLogs'));
  const deletedWebPushSubscriptions = await deleteCollection(db.collection('webPushSubscriptions'));

  console.log(
    `삭제 완료 — 유저 ${deletedUsers}명, bookProgress 문서 ${deletedBookProgress}개, 참여 기록 ${deletedParticipants}건, 화이팅 로그 ${deletedCheerLogs}건, 찌르기 로그 ${deletedPokeLogs}건, 웹푸시 구독 ${deletedWebPushSubscriptions}건`
  );
}

resetUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('초기화 실패:', error);
    process.exit(1);
  });
