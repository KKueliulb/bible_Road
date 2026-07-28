# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

Project was originally downgraded from Expo SDK 57 to SDK 54 so Expo Go could be used for on-device
testing. It was upgraded back to SDK 57 when push notifications (step 9) were added, because Expo Go
does not support remote push regardless of SDK version — testing now requires an EAS Build (Android
internal-distribution APK, see README's "푸시 알림" section), not Expo Go. `npx expo start` +
Expo Go still works fine for iterating on everything else that doesn't touch push notifications.
