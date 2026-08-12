# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

Project is on Expo SDK 54 so Expo Go can be used for on-device testing. It was briefly bumped to
SDK 57 while exploring remote push notifications (step 9), which requires leaving Expo Go for an
EAS Build. That plan was dropped in favor of a free, server-less approach — step 9 ended up as a
local-only daily reminder notification (see README's "알림" section) — so the SDK was reverted back
to 54 since there was no remaining reason to leave Expo Go. `npx expo start` + Expo Go works for
all current features, including notifications.
