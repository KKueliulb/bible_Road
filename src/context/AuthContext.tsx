import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserDoc } from '../types/models';
import { createUser, findUserByNickname, getUserById, isNicknameTaken, updateUser } from '../services/usersService';
import { registerForPushNotifications } from '../services/notificationsService';

const SESSION_KEY = 'bible_road_user_id';

type AuthResult = { ok: true } | { ok: false; error: string };

interface AuthContextValue {
  isLoading: boolean;
  userId: string | null;
  user: UserDoc | null;
  signup: (name: string, nickname: string) => Promise<AuthResult>;
  login: (nickname: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<UserDoc | null>(null);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const storedUserId = await AsyncStorage.getItem(SESSION_KEY);
      if (!storedUserId) return;

      const userData = await getUserById(storedUserId);
      if (userData) {
        setUserId(storedUserId);
        setUser(userData);
      } else {
        await AsyncStorage.removeItem(SESSION_KEY);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function signup(name: string, nickname: string): Promise<AuthResult> {
    const trimmedName = name.trim();
    const trimmedNickname = nickname.trim();
    if (!trimmedName || !trimmedNickname) {
      return { ok: false, error: '본명과 닉네임을 모두 입력해주세요.' };
    }
    if (await isNicknameTaken(trimmedNickname)) {
      return { ok: false, error: '이미 사용 중인 닉네임입니다.' };
    }

    // 회원가입 후에는 자동 로그인하지 않고, 로그인 화면에서 닉네임으로 다시 로그인하게 한다.
    await createUser(trimmedName, trimmedNickname);
    return { ok: true };
  }

  async function login(nickname: string): Promise<AuthResult> {
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      return { ok: false, error: '닉네임을 입력해주세요.' };
    }

    const found = await findUserByNickname(trimmedNickname);
    if (!found) {
      return { ok: false, error: '해당 닉네임의 계정을 찾을 수 없어요. 회원가입을 진행해주세요.' };
    }

    await AsyncStorage.setItem(SESSION_KEY, found.id);
    setUserId(found.id);
    setUser(found.data);
    return { ok: true };
  }

  async function logout() {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUserId(null);
    setUser(null);
  }

  async function refreshUser() {
    if (!userId) return;
    const userData = await getUserById(userId);
    if (userData) setUser(userData);
  }

  // 로그인/세션 복원 직후 푸시 알림 권한을 요청하고 토큰을 등록한다. Expo Go나 시뮬레이터,
  // 권한 거부 시에는 registerForPushNotifications가 null을 반환하므로 아무 것도 하지 않는다.
  useEffect(() => {
    if (!userId) return;
    let isCancelled = false;

    registerForPushNotifications().then((token) => {
      if (isCancelled || !token) return;
      updateUser(userId, { expoPushToken: token }).catch(() => {
        // 토큰 저장 실패는 부가 기능이라 조용히 무시
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  const value = useMemo(
    () => ({ isLoading, userId, user, signup, login, logout, refreshUser }),
    [isLoading, userId, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
