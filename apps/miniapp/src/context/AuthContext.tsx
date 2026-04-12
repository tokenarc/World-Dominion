import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

type AuthState = 'loading' | 'ready' | 'error';

interface AuthContextType {
  state: AuthState;
  error: string | null;
  user: any;
  player: any;
  token: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const verifyMutation = useMutation(api.auth.telegramVerify);
  const sessionUser = useQuery(api.auth.getSessionUser, token ? { token } : 'skip');

  useEffect(() => {
    const stored = localStorage.getItem('wd_token');
    if (stored) {
      setToken(stored);
      return;
    }

    if (typeof window === 'undefined') return;
    
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.initData) {
      setState('error');
      setError('Open through Telegram bot.');
      return;
    }

    tg.ready();
    tg.expand();

    verifyMutation({ initData: tg.initData })
      .then((result: any) => {
        if (result?.token) {
          localStorage.setItem('wd_token', result.token);
          setToken(result.token);
        } else {
          setState('error');
          setError('Auth failed. Try again.');
        }
      })
      .catch((err: any) => {
        setState('error');
        setError(err.message || 'Auth failed.');
      });
  }, []);

  useEffect(() => {
    if (sessionUser === undefined) return;
    if (sessionUser === null) {
      localStorage.removeItem('wd_token');
      setToken(null);
      setState('error');
      setError('Session expired. Reopen the app.');
      return;
    }
    setState('ready');
  }, [sessionUser]);

  const logout = () => {
    localStorage.removeItem('wd_token');
    setToken(null);
    setState('loading');
  };

  return (
    <AuthContext.Provider value={{ state, error, user: sessionUser?.user || null, player: sessionUser?.player || null, token, logout }}>
      {children}
    </AuthContext.Provider>
  );
}