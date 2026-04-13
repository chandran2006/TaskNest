import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, AuthContextType } from '../types';
import api from '../services/api';

const AuthContext = createContext<AuthContextType | null>(null);

function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

async function fetchUserFromServer(): Promise<User | null> {
  try {
    const { data } = await api.get<{ user: User }>('/auth/me');
    return data.user;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]   = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // On startup: validate token and fetch fresh role from DB
  useEffect(() => {
    const storedToken = localStorage.getItem('token');

    if (!storedToken || !isTokenValid(storedToken)) {
      clearSession();
      setReady(true);
      return;
    }

    // Token is in localStorage — interceptor will attach it automatically
    fetchUserFromServer().then((freshUser) => {
      if (freshUser) {
        setToken(storedToken);
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
      } else {
        clearSession();
      }
      setReady(true);
    });
  }, []);

  // After login/signup: set token first (so interceptor can use it), then fetch fresh role
  const login = useCallback(async (newToken: string, newUser: User) => {
    // Set token in localStorage BEFORE calling fetchUserFromServer
    // so the request interceptor can attach it
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);

    // Fetch fresh user from DB to get the definitive role
    const freshUser = await fetchUserFromServer();
    if (freshUser) {
      setUser(freshUser);
      localStorage.setItem('user', JSON.stringify(freshUser));
    }
  }, []);

  // Force a role re-check from DB — call this after any role change
  const refreshUser = useCallback(async () => {
    const freshUser = await fetchUserFromServer();
    if (freshUser) {
      setUser(freshUser);
      localStorage.setItem('user', JSON.stringify(freshUser));
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  // Block render until role is confirmed from DB
  if (!ready) return null;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      refreshUser,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
