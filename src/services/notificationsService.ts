import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// 포그라운드(앱을 보고 있는 중)에도 알림 배너/사운드를 그대로 보여준다.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const DAILY_REMINDER_ID = 'daily-reading-reminder';

async function ensureNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '기본 알림',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

/** "HH:mm" 형식의 리마인더 시각을 파싱한다. 형식이 잘못됐으면 기본값(20:00)으로 대체한다. */
function parseReminderTime(hhmm: string): { hour: number; minute: number } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!match) return { hour: 20, minute: 0 };
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

function nextReminderDate(now: Date, reminderTime: string, alreadyReadToday: boolean): Date {
  const { hour, minute } = parseReminderTime(reminderTime);
  const todayAtReminderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (!alreadyReadToday && now < todayAtReminderTime) {
    return todayAtReminderTime;
  }
  // 오늘 이미 읽었거나, 오늘 리마인더 시각이 이미 지났으면 내일 같은 시각으로 예약한다.
  const tomorrowAtReminderTime = new Date(todayAtReminderTime);
  tomorrowAtReminderTime.setDate(tomorrowAtReminderTime.getDate() + 1);
  return tomorrowAtReminderTime;
}

/**
 * users/{userId}.dailyReminderTime("HH:mm")에 맞춰 리마인더를 서버 없이 기기에 직접 예약한다
 * (로컬 알림 — 원격 푸시가 아니라 Expo Go에서도 동작하고, 인터넷 연결도 필요 없다). 로그인 직후,
 * 그리고 "읽었어요!"에 성공할 때마다 다시 호출해서 다시 계산한다: 오늘 이미 읽었으면 오늘 몫은
 * 건너뛰고 내일로, 아직이면 오늘의 리마인더 시각으로 예약한다. 알림 권한이 없으면 조용히 아무 것도
 * 하지 않는다.
 */
export async function refreshDailyReminder(reminderTime: string, hasReadToday: boolean): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {
    // 예약된 게 없으면 실패하는데, 무시해도 된다.
  });

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: 'Bible Road',
      body: '아직 말씀을 읽지 않으셨네요? 지금 읽어볼까요? 🔥',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextReminderDate(new Date(), reminderTime, hasReadToday),
    },
  });
}

/**
 * 개발용: 실제 알림이 뜨는지 바로 확인해보기 위해 N초 뒤 테스트 알림을 예약한다.
 * 권한이 없으면 예약하지 않고 false를 반환한다.
 */
export async function sendTestNotificationIn(seconds: number): Promise<boolean> {
  const granted = await ensureNotificationPermission();
  if (!granted) return false;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '테스트 알림',
      body: `${seconds}초 뒤에 뜨는 알림이 잘 보이면 정상 동작하는 거예요.`,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
  return true;
}
