/**
 * 특정 유저(본명 기준)의 진행 상태를 지정한 책의 N장까지 읽은 것으로 강제 설정하는 1회성 관리 스크립트.
 *
 * 아래 TARGET_NAME/TARGET_BOOK_ID/TARGET_CHAPTERS_READ만 바꿔서 재사용할 수 있습니다.
 * 바뀌는 것: users/{userId}의 currentBookId/currentTestament/currentChapter/totalProgressPercent/
 * progressUpdatedAt + users/{userId}/bookProgress/{bookId} 문서(chaptersRead/status/completedAt).
 * 스트릭/유예/밀린 장수/lastReadAt 등은 건드리지 않습니다.
 *
 * 사용법:
 * 1. Firebase 콘솔 > 프로젝트 설정 > 서비스 계정에서 비공개 키(JSON)를 발급받아
 *    저장소 루트에 serviceAccountKey.json 으로 저장 (git에 커밋하지 말 것, .gitignore에 포함됨)
 * 2. npx tsx src/scripts/setUserProgress.ts 실행
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BOOKS, TOTAL_BIBLE_CHAPTERS } from '../data/books';

const TARGET_NAME = '최시우';
const TARGET_BOOK_ID = 'genesis';
const TARGET_CHAPTERS_READ = 33;

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

async function setUserProgress() {
  const targetBook = BOOKS.find((book) => book.id === TARGET_BOOK_ID);
  if (!targetBook) {
    console.error(`알 수 없는 책 id: ${TARGET_BOOK_ID}`);
    process.exit(1);
  }
  if (TARGET_CHAPTERS_READ < 0 || TARGET_CHAPTERS_READ > targetBook.totalChapters) {
    console.error(`${targetBook.name}은 총 ${targetBook.totalChapters}장입니다. ${TARGET_CHAPTERS_READ}장은 범위를 벗어났습니다.`);
    process.exit(1);
  }

  const matches = await db.collection('users').where('name', '==', TARGET_NAME).get();
  if (matches.empty) {
    console.error(`본명이 "${TARGET_NAME}"인 유저를 찾을 수 없습니다.`);
    process.exit(1);
  }
  if (matches.size > 1) {
    console.error(`본명이 "${TARGET_NAME}"인 유저가 ${matches.size}명 있습니다. 스크립트를 수정해 userId로 지정해주세요:`);
    matches.docs.forEach((docSnap) => console.error(`  - userId=${docSnap.id}, nickname=${docSnap.data().nickname}`));
    process.exit(1);
  }

  const userDoc = matches.docs[0];
  const userId = userDoc.id;
  const userData = userDoc.data();

  // 이 책을 제외한, 지금까지 읽은 다른 모든 책의 장수 합(진척도 재계산용).
  const otherProgressSnapshot = await userDoc.ref.collection('bookProgress').get();
  const otherChaptersReadTotal = otherProgressSnapshot.docs
    .filter((docSnap) => docSnap.id !== TARGET_BOOK_ID)
    .reduce((sum, docSnap) => sum + (docSnap.data().chaptersRead?.length ?? 0), 0);

  const chaptersRead = Array.from({ length: TARGET_CHAPTERS_READ }, (_, i) => i + 1);
  const status = chaptersRead.length >= targetBook.totalChapters ? 'completed' : 'in_progress';
  const now = Date.now();

  await userDoc.ref.collection('bookProgress').doc(TARGET_BOOK_ID).set({
    chaptersRead,
    status,
    completedAt: status === 'completed' ? now : null,
  });

  const totalProgressPercent = Math.round(((otherChaptersReadTotal + chaptersRead.length) / TOTAL_BIBLE_CHAPTERS) * 1000) / 10;

  await userDoc.ref.set(
    {
      currentBookId: TARGET_BOOK_ID,
      currentTestament: targetBook.testament,
      currentChapter: chaptersRead.length,
      totalProgressPercent,
      progressUpdatedAt: now,
    },
    { merge: true }
  );

  console.log(
    `완료 — ${TARGET_NAME}(닉네임: ${userData.nickname}, userId: ${userId})의 진행 상태를 ${targetBook.name} ${TARGET_CHAPTERS_READ}장으로 설정했습니다. 전체 진행률: ${totalProgressPercent}%`
  );
}

setUserProgress()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('처리 실패:', error);
    process.exit(1);
  });
