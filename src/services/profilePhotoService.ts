import { File } from 'expo-file-system';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

/** 로컬 이미지 URI(expo-image-picker 결과)를 Firebase Storage에 업로드하고 다운로드 URL을 반환한다. */
export async function uploadProfilePhoto(userId: string, localUri: string): Promise<string> {
  // React Native의 fetch(uri).blob()과 XMLHttpRequest 기반 Blob 변환 둘 다, 이 프로젝트가 쓰는
  // Firebase JS SDK 버전과 조합했을 때 "storage/unknown" 오류로 업로드가 실패하는 걸 확인했다
  // (RN의 Blob 폴리필이 Firebase Storage가 기대하는 형태와 맞지 않는 것으로 보임).
  // expo-file-system의 File.arrayBuffer()로 파일을 직접 읽어 Blob을 완전히 우회한다.
  const bytes = await new File(localUri).arrayBuffer();

  const photoRef = ref(storage, `profilePhotos/${userId}.jpg`);
  await uploadBytes(photoRef, bytes, { contentType: 'image/jpeg' });
  const downloadURL = await getDownloadURL(photoRef);

  // 같은 경로에 덮어쓰면 다운로드 URL이 이전과 같을 수 있어, RN의 <Image> 캐시가 예전 사진을 계속
  // 보여줄 수 있다. 매번 값이 달라지는 쿼리 파라미터를 붙여 항상 새로 불러오게 만든다.
  return `${downloadURL}&_v=${Date.now()}`;
}
