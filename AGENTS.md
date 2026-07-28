# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

Project was originally downgraded from Expo SDK 57 to SDK 54 so Expo Go could be used for on-device
testing. It was upgraded back to SDK 57 while exploring remote push notifications (step 9), which
briefly required leaving Expo Go for an EAS Build. That plan was dropped in favor of a free,
server-less approach: step 9 ended up as a local-only daily reminder notification (see README's
"알림" section), which works fine in Expo Go — the EAS Build detour turned out to be unnecessary,
but the SDK stayed at 57 (never reverted to 54) since there was no remaining reason to go back.
`npx expo start` + Expo Go works for all current features, including notifications.
