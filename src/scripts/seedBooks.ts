/**
 * books 컬렉션 시딩 스크립트.
 *
 * 사용법:
 * 1. Firebase 콘솔 > 프로젝트 설정 > 서비스 계정에서 비공개 키(JSON)를 발급받아
 *    저장소 루트에 serviceAccountKey.json 으로 저장 (git에 커밋하지 말 것, .gitignore에 포함됨)
 * 2. npm run seed:books 실행
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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

async function seedBooks() {
  const batch = db.batch();

  for (const { id, ...book } of BOOKS) {
    batch.set(db.collection('books').doc(id), book);
  }

  await batch.commit();
  console.log(`books 컬렉션에 ${BOOKS.length}권을 시딩했습니다.`);
}

seedBooks()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('시딩 실패:', error);
    process.exit(1);
  });
