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

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Loading TaskNest…</p>
      </div>
    </div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]   = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');

    if (!storedToken || !isTokenValid(storedToken)) {
      clearSession();
      setReady(true);
      return;
    }

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

  const login = useCallback(async (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

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

  if (!ready) return <FullScreenLoader />;

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
