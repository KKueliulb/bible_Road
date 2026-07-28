/**
 * 랭킹 화면 테스트용 더미 유저 55명을 생성하는 시딩 스크립트.
 *
 * 닉네임에 "테스트유저" 접두사를 붙여 실제 유저와 구분되게 만듭니다. 회독수(rereadCount)와
 * 총 진행률(totalProgressPercent)을 무작위로 생성하고, 그 진행률에 맞춰 currentBookId/currentChapter도
 * 앞뒤가 맞게 계산해 넣습니다(랭킹 화면의 "현재 읽고 있는 위치" 표시 확인용).
 * bookProgress 서브컬렉션은 만들지 않습니다(랭킹 화면 테스트에는 필요 없음).
 *
 * ⚠️ 테스트가 끝나면 `npm run reset:users`로 지우세요(테스트 유저뿐 아니라 전체 유저가 삭제되니 주의).
 *
 * 사용법:
 * 1. Firebase 콘솔 > 프로젝트 설정 > 서비스 계정에서 비공개 키(JSON)를 발급받아
 *    저장소 루트에 serviceAccountKey.json 으로 저장 (git에 커밋하지 말 것, .gitignore에 포함됨)
 * 2. npm run seed:ranking 실행
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BOOKS, TOTAL_BIBLE_CHAPTERS } from '../data/books';
import { UserDoc } from '../types/models';

const SERVICE_ACCOUNT_PATH = path.resolve(process.cwd(), 'serviceAccountKey.json');
const USER_COUNT = 55;

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

const SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권'];
const GIVEN_NAMES = [
  '민준', '서연', '도윤', '하은', '시우', '지우', '예준', '수아', '지호', '다은',
  '현우', '유진', '준서', '채원', '민서', '지안', '하윤', '은우', '소율', '태윤',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

/** 회독수는 대부분 0~1회에 몰리고 소수만 2~3회를 갖도록 가중치를 준다. */
function randomRereadCount(): number {
  const roll = Math.random();
  if (roll < 0.6) return 0;
  if (roll < 0.85) return 1;
  if (roll < 0.95) return 2;
  return 3;
}

/** 전체 성경 기준 누적 읽은 장수를 현재 책 ID + 그 책 안에서 읽은 장수로 변환한다. */
function resolveCurrentPosition(chaptersReadOverall: number): { bookId: string; testament: 'OT' | 'NT'; currentChapter: number } {
  let remaining = chaptersReadOverall;
  for (const book of BOOKS) {
    if (remaining < book.totalChapters) {
      return { bookId: book.id, testament: book.testament, currentChapter: remaining };
    }
    remaining -= book.totalChapters;
  }
  const last = BOOKS[BOOKS.length - 1];
  return { bookId: last.id, testament: last.testament, currentChapter: last.totalChapters - 1 };
}

async function seedTestRanking() {
  const batch = db.batch();

  for (let i = 1; i <= USER_COUNT; i += 1) {
    const nickname = `테스트유저${String(i).padStart(2, '0')}`;
    const name = `${pick(SURNAMES)}${pick(GIVEN_NAMES)}`;
    const chaptersReadOverall = randomInt(0, TOTAL_BIBLE_CHAPTERS - 1);
    const totalProgressPercent = Math.round((chaptersReadOverall / TOTAL_BIBLE_CHAPTERS) * 1000) / 10;
    const { bookId, testament, currentChapter } = resolveCurrentPosition(chaptersReadOverall);

    const data: UserDoc = {
      name,
      nickname,
      nicknameChangeCount: 0,
      lastNicknameChangedAt: null,
      currentTestament: testament,
      currentBookId: bookId,
      currentChapter,
      totalProgressPercent,
      streakDays: randomInt(0, 30),
      lastReadAt: null,
      lastExtraReadAt: null,
      overdueChapters: 0,
      extraChaptersRepaid: 0,
      graceDaysLeft: 2,
      rereadCount: randomRereadCount(),
      roadmapStartTestament: 'OT',
      hasOnboarded: true,
      fcmToken: null,
      dailyReminderTime: '20:00',
      // 가입 시각을 넓게 흩어놓아야 아바타 배경색(createdAt 기반 16진수)이 사람마다 다르게 나온다.
      createdAt: Date.now() - randomInt(0, 730 * 86400000),
    };

    batch.set(db.collection('users').doc(), data);
  }

  await batch.commit();
  console.log(`테스트 유저 ${USER_COUNT}명을 생성했습니다. (닉네임: 테스트유저01~테스트유저${USER_COUNT})`);
}

seedTestRanking()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('시딩 실패:', error);
    process.exit(1);
  });
