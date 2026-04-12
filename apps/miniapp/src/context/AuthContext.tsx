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
  const [hasStarted, setHasStarted] = useState(false);

  const verifyMutation = useMutation(api.auth.telegramVerify as any);
  const sessionUser = useQuery(api.auth.getSessionUser as any, token ? { token } : 'skip');

  useEffect(() => {
    if (hasStarted) return;
    setHasStarted(true);

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

    tg.ready();
    tg.expand();

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
  }, [hasStarted]);

  useEffect(() => {
    if (!token) return;
    if (sessionUser === undefined) return;
    
    if (sessionUser === null) {
      localStorage.removeItem('wd_token');
      setToken(null);
      setState('error');
      setError('Session expired. Reopen the app.');
      return;
    }
    
    setState('ready');
  }, [token, sessionUser]);

  const logout = () => {
    localStorage.removeItem('wd_token');
    setToken(null);
    setState('loading');
  };

  const value = React.useMemo(() => ({
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