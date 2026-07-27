import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserDoc } from '../types/models';
import { createUser, findUserByNickname, getUserById, isNicknameTaken } from '../services/usersService';

const SESSION_KEY = 'bible_road_user_id';

type AuthResult = { ok: true } | { ok: false; error: string };

interface AuthContextValue {
  isLoading: boolean;
  userId: string | null;
  user: UserDoc | null;
  signup: (name: string, nickname: string) => Promise<AuthResult>;
  login: (nickname: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
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

    const { id, data } = await createUser(trimmedName, trimmedNickname);
    await AsyncStorage.setItem(SESSION_KEY, id);
    setUserId(id);
    setUser(data);
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

  const value = useMemo(
    () => ({ isLoading, userId, user, signup, login, logout }),
    [isLoading, userId, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
