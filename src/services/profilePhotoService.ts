import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

/** 로컬 이미지 URI(expo-image-picker 결과)를 Firebase Storage에 업로드하고 다운로드 URL을 반환한다. */
export async function uploadProfilePhoto(userId: string, localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const photoRef = ref(storage, `profilePhotos/${userId}.jpg`);
  await uploadBytes(photoRef, blob);
  return getDownloadURL(photoRef);
}
