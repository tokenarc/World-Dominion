import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
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

const AuthContext = createContext<AuthContextType>({
  state: 'loading',
  error: null,
  user: null,
  player: null,
  token: null,
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const verifyMutation = useMutation(api.auth.telegramVerify as any);
  const sessionUser = useQuery(api.auth.getSessionUser as any, token ? { token } : 'skip');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('wd_token');
    if (stored) {
      setToken(stored);
      return;
    }

    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.initData) {
      setState('error');
      setError('Open through Telegram bot.');
      return;
    }

    try {
      tg.ready();
      tg.expand();
    } catch (e) {
      console.warn('[Auth] Telegram init warning:', e);
    }

    verifyMutation({ initData: tg.initData })
      .then((result: any) => {
        if (result?.success && result?.token) {
          localStorage.setItem('wd_token', result.token);
          setToken(result.token);
        } else {
          setState('error');
          setError(result?.message || 'Auth failed. Try again.');
        }
      })
      .catch((err: any) => {
        setState('error');
        setError(err?.message || 'Auth failed.');
      });
  }, []);

  useEffect(() => {
    if (!token) return;
    if (sessionUser === undefined) return;
    
    if (sessionUser === null) {
      try { localStorage.removeItem('wd_token'); } catch (e) {}
      setToken(null);
      setState('error');
      setError('Session expired. Reopen the app.');
      return;
    }
    
    setState('ready');
  }, [token, sessionUser]);

  const logout = () => {
    try { localStorage.removeItem('wd_token'); } catch (e) {}
    setToken(null);
    setState('loading');
  };

  const value = useMemo(() => ({
    state,
    error,
    user: sessionUser?.user || null,
    player: sessionUser?.player || null,
    token,
    logout,
  }), [state, error, sessionUser, token]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}