import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

// React Native의 fetch().blob()은 로컬 파일 URI에서 깨지거나 빈 Blob을 만드는 경우가 있어
// (업로드는 "성공"하지만 실제 이미지가 비어있어 변경이 반영 안 된 것처럼 보임), Firebase가 RN 환경에
// 공식적으로 권장하는 XMLHttpRequest 기반 방식으로 Blob을 만든다.
function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('이미지를 불러오지 못했어요.'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

/** 로컬 이미지 URI(expo-image-picker 결과)를 Firebase Storage에 업로드하고 다운로드 URL을 반환한다. */
export async function uploadProfilePhoto(userId: string, localUri: string): Promise<string> {
  const blob = await uriToBlob(localUri);

  const photoRef = ref(storage, `profilePhotos/${userId}.jpg`);
  await uploadBytes(photoRef, blob);
  const downloadURL = await getDownloadURL(photoRef);

  // 같은 경로에 덮어쓰면 다운로드 URL이 이전과 같을 수 있어, RN의 <Image> 캐시가 예전 사진을 계속
  // 보여줄 수 있다. 매번 값이 달라지는 쿼리 파라미터를 붙여 항상 새로 불러오게 만든다.
  return `${downloadURL}&_v=${Date.now()}`;
}
