import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

type AuthStage = 'init' | 'checking-env' | 'checking-telegram' | 'authenticating' | 'loading-player' | 'ready' | 'error';

interface AuthContextType {
  isAuthenticated: boolean;
  authStage: AuthStage;
  authError: string | null;
  user: any;
  player: any;
  sessionToken: string | null;
  logout: () => void;
  retry: () => void;
  debugInfo: any;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [authStage, setAuthStage] = useState<AuthStage>('init');
  const [authError, setAuthError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [envCheck, setEnvCheck] = useState<any>(null);

  // Only run after client-side mount
  useEffect(() => {
    setMounted(true);
    setEnvCheck({ allValid: true });
  }, []);

  // Only create hooks after mount
  const sessionUser = mounted && sessionToken 
    ? useQuery(api.auth.getSessionUser as any, { token: sessionToken })
    : null;

  const verifyMutation = mounted ? useMutation(api.auth.telegramVerify as any) : null;
  const logoutMutation = mounted ? useMutation(api.auth.logout as any) : null;

  const logout = useCallback(() => {
    if (sessionToken && logoutMutation) {
      logoutMutation({ token: sessionToken });
    }
    setSessionToken(null);
    localStorage.removeItem('wd_session_token');
    setAuthStage('init');
    setAuthError(null);
  }, [sessionToken, logoutMutation]);

  const retry = useCallback(() => {
    setAuthStage('init');
    setAuthError(null);
    setDebugInfo({});
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tg = (window as any).Telegram?.WebApp;
    if (!tg) {
      setAuthStage('error');
      setAuthError('Telegram WebApp not available');
      setDebugInfo({ telegramAvailable: false });
      return;
    }

    try {
      tg.ready();
      tg.expand();
      setDebugInfo(prev => ({ ...prev, telegramReady: true }));
    } catch (err: any) {
      setAuthStage('error');
      setAuthError(`Telegram init failed: ${err.message}`);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return; // Skip during SSR
    if (authStage !== 'init') return;
    if (!envCheck) return;

    setAuthStage('checking-env');

    if (!envCheck.allValid) {
      setAuthStage('error');
      setAuthError(`Environment issues: ${envCheck.issues.join(', ')}`);
      setDebugInfo({ envCheck });
      return;
    }

    setAuthStage('checking-telegram');

    const tg = (window as any).Telegram?.WebApp;
    if (!tg) {
      setAuthStage('error');
      setAuthError('Telegram not available');
      return;
    }

    const initData = tg.initData;
    if (!initData || initData.length === 0) {
      setAuthStage('error');
      setAuthError('No initData from Telegram. Open via Telegram bot.');
      setDebugInfo({ hasInitData: false });
      return;
    }

    setDebugInfo({ hasInitData: true, initDataLength: initData.length });

    const storedToken = localStorage.getItem('wd_session_token');
    if (storedToken) {
      setSessionToken(storedToken);
      setAuthStage('loading-player');
      return;
    }

    setAuthStage('authenticating');
    
    verifyMutation({ initData, debug: true })
      .then((result: any) => {
        if (result.debug) {
          setDebugInfo({ hmacDebug: result.debug });
        }

        if (!result.success) {
          setAuthStage('error');
          setAuthError(`Auth failed: ${result.debug?.error || 'Unknown error'}`);
          return;
        }

        if (result.token) {
          localStorage.setItem('wd_session_token', result.token);
          setSessionToken(result.token);
          setAuthStage('loading-player');
        } else {
          setAuthStage('error');
          setAuthError('No token received');
        }
      })
      .catch((err: any) => {
        setAuthStage('error');
        setAuthError(`Mutation error: ${err.message}`);
      });
  }, [authStage, envCheck, verifyMutation]);

  useEffect(() => {
    if (!mounted) return;
    if (authStage !== 'loading-player') return;
    if (sessionUser === undefined) return;

    if (sessionUser === null) {
      localStorage.removeItem('wd_session_token');
      setSessionToken(null);
      setAuthStage('error');
      setAuthError('Session expired. Reopening app...');
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          (window as any).Telegram?.WebApp?.close();
        }
      }, 2000);
      return;
    }

    setAuthStage('ready');
  }, [sessionUser, authStage]);

  const value: AuthContextType = {
    isAuthenticated: authStage === 'ready',
    authStage,
    authError,
    user: sessionUser?.user || null,
    player: sessionUser?.player || null,
    sessionToken,
    logout,
    retry,
    debugInfo,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}