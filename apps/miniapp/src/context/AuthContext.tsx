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
  isLoading: boolean;
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
  const [authTimeout, setAuthTimeout] = useState(false);

  const sessionUserQuery = useQuery(api.auth.getSessionUser as any, sessionToken ? { token: sessionToken } : 'skip');
  const verifyMutation = useMutation(api.auth.telegramVerify as any);
  const logoutMutation = useMutation(api.auth.logout as any);

  useEffect(() => {
    console.log('[Auth] Component mounted, initializing...');
    setMounted(true);
    setEnvCheck({ allValid: true });
    
    const timeoutId = setTimeout(() => {
      if (authStage !== 'ready' && authStage !== 'error') {
        setAuthTimeout(true);
        setAuthStage('error');
        setAuthError('Authentication timeout. Please reopen from Telegram.');
      }
    }, 15000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const sessionUser = sessionToken ? sessionUserQuery : null;

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
    if (!mounted) return;
    console.log('[Auth] Auth effect triggered, stage:', authStage);
    if (authStage !== 'init') return;
    if (!envCheck) return;

    console.log('[Auth] Stage: checking-env');
    setAuthStage('checking-env');

    if (!envCheck.allValid) {
      setAuthStage('error');
      setAuthError(`Environment issues: ${envCheck.issues.join(', ')}`);
      setDebugInfo({ envCheck });
      return;
    }

    setAuthStage('checking-telegram');

    const tg = (window as any).Telegram?.WebApp;
    console.log('[Auth] Checking Telegram WebApp:', tg ? 'FOUND' : 'NOT FOUND');
    if (!tg) {
      console.log('[Auth] ERROR: Telegram WebApp not available');
      setAuthStage('error');
      setAuthError('Telegram WebApp not available. Open through Telegram bot.');
      setDebugInfo({ telegramAvailable: false });
      return;
    }

    const initData = tg.initData;
    console.log('[Auth] initData:', initData ? `present (${initData.length} chars)` : 'EMPTY');
    if (!initData || initData.length === 0) {
      console.log('[Auth] ERROR: No initData from Telegram');
      setAuthStage('error');
      setAuthError('No initData from Telegram. Open via Telegram bot.');
      setDebugInfo({ hasInitData: false });
      return;
    }

    console.log('[Auth] Stage: checking-telegram - SUCCESS');
    setDebugInfo({ hasInitData: true, initDataLength: initData.length });

    const storedToken = localStorage.getItem('wd_session_token');
    if (storedToken) {
      setSessionToken(storedToken);
      setAuthStage('loading-player');
      return;
    }

    console.log('[Auth] Stage: authenticating - calling verifyMutation');
    setAuthStage('authenticating');
    
    if (!verifyMutation) {
      console.log('[Auth] ERROR: verifyMutation not available');
      setAuthStage('error');
      setAuthError('Authentication system not ready');
      return;
    }
    
    verifyMutation({ initData, debug: true })
      .then((result: any) => {
        console.log('[Auth] verifyMutation result:', result);
        if (result.debug) {
          setDebugInfo({ hmacDebug: result.debug });
        }

        if (!result.success) {
          console.log('[Auth] ERROR: Verification failed');
          setAuthStage('error');
          setAuthError(`Auth failed: ${result.debug?.error || 'Unknown error'}`);
          return;
        }

        if (result.token) {
          console.log('[Auth] SUCCESS: Token received, saving to localStorage');
          localStorage.setItem('wd_session_token', result.token);
          setSessionToken(result.token);
          setAuthStage('loading-player');
        } else {
          console.log('[Auth] ERROR: No token in result');
          setAuthStage('error');
          setAuthError('No token received');
        }
      })
      .catch((err: any) => {
        console.log('[Auth] ERROR: Mutation exception:', err.message);
        setAuthStage('error');
        setAuthError(`Mutation error: ${err.message}`);
      });
  }, [authStage, envCheck, mounted]);

  useEffect(() => {
    if (!mounted) return;
    console.log('[Auth] Session check, stage:', authStage, 'sessionUser:', sessionUser);
    if (authStage !== 'loading-player') return;
    if (sessionUser === undefined) return;

    if (sessionUser === null) {
      console.log('[Auth] ERROR: Session invalid');
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

    console.log('[Auth] SUCCESS: Session valid, ready!');
    setAuthStage('ready');
  }, [sessionUser, authStage, mounted]);

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
    isLoading: authStage !== 'ready' && authStage !== 'error',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}