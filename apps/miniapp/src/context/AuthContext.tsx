import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

type AuthStage = 'init' | 'authenticating' | 'loading-player' | 'ready' | 'error';

interface User {
  id: number;
  telegramId?: number;
  firstName: string;
  lastName?: string;
  username?: string;
}

interface Player {
  _id: string;
  telegramId: number;
  username: string;
  firstName: string;
  lastName?: string;
  nationId?: string;
  currentNation?: string;
  role?: string;
  currentRole?: string;
  wallet: {
    warBonds: number;
    commandPoints: number;
  };
  stats: {
    totalScore: number;
    warBonds: number;
    commandPoints: number;
    reputation: number;
    militaryKnowledge: number;
  };
  reputation: number;
  kycVerified: boolean;
  joinedAt: number;
  lastActive: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  authStage: AuthStage;
  authError: string | null;
  user: User | null;
  player: Player | null;
  sessionToken: string | null;
  logout: () => void;
  retry: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function hasApi(): boolean {
  if (!isBrowser()) return false;
  try {
    return typeof api?.auth?.getSessionUser === 'function';
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [authStage, setAuthStage] = useState<AuthStage>('init');
  const [authError, setAuthError] = useState<string | null>(null);
  const [tgReady, setTgReady] = useState(false);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initCalledRef = useRef(false);

  // Prepare Convex query - only run when we have a token
  const sessionUser = hasApi() && sessionToken
    ? useQuery(api.auth.getSessionUser as any, { token: sessionToken })
    : null;

  const verifyMutation = hasApi() ? useMutation(api.auth.telegramVerify as any) : null;
  const logoutMutation = hasApi() ? useMutation(api.auth.logout as any) : null;

  // Initialize Telegram WebApp
  useEffect(() => {
    if (!isBrowser() || initCalledRef.current) return;
    initCalledRef.current = true;

    const tg = (window as any).Telegram?.WebApp;
    if (!tg) {
      console.log('[Auth] Telegram.WebApp not available');
      return;
    }

    try {
      tg.ready();
      tg.expand();
      console.log('[Auth] Telegram.WebApp ready() and expand() called');
      setTgReady(true);
    } catch (err) {
      console.log('[Auth] Telegram.WebApp init error:', err);
    }
  }, []);

  const logout = useCallback(() => {
    if (sessionToken && logoutMutation) {
      logoutMutation({ token: sessionToken });
    }
    setSessionToken(null);
    if (isBrowser()) {
      localStorage.removeItem('wd_session_token');
    }
    setAuthStage('init');
    setAuthError(null);
  }, [sessionToken, logoutMutation]);

  const retry = useCallback(() => {
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current);
    }
    setAuthStage('init');
    setAuthError(null);
    // Will trigger checkAuth via the useEffect
    setTimeout(() => initCalledRef.current = false, 100);
  }, []);

  const checkAuth = useCallback(async () => {
    if (!isBrowser()) return;
    
    try {
      setAuthStage('authenticating');
      
      const tg = (window as any).Telegram?.WebApp;
      
      if (!tg) {
        console.log('[Auth] Telegram.WebApp not available');
        setAuthStage('error');
        setAuthError('Telegram WebApp not available. Open through Telegram.');
        return;
      }

      const initData = tg.initData;
      console.log('[Auth] initData length:', initData?.length || 0);
      
      if (!initData || initData.length === 0) {
        console.log('[Auth] No initData from Telegram');
        setAuthStage('error');
        setAuthError('No initData. Open the app through Telegram bot.');
        return;
      }

      // Check localStorage first
      let token = localStorage.getItem('wd_session_token');
      
      // If no stored token, verify with initData
      if (!token) {
        if (!verifyMutation) {
          console.log('[Auth] verifyMutation not available');
          setAuthStage('error');
          setAuthError('Authentication system not ready. Retry.');
          return;
        }

        try {
          console.log('[Auth] Verifying initData with Convex...');
          const result = await verifyMutation({ initData });
          console.log('[Auth] verifyMutation result:', result);
          
          if (result?.success && result.token) {
            token = result.token;
            localStorage.setItem('wd_session_token', token);
            console.log('[Auth] Token saved to localStorage');
          } else {
            console.log('[Auth] Verification failed:', result);
            setAuthStage('error');
            setAuthError(result?.error || 'Authentication failed. Try again.');
            return;
          }
        } catch (mutErr: any) {
          console.log('[Auth] verifyMutation error:', mutErr.message);
          setAuthStage('error');
          setAuthError('Authentication error: ' + (mutErr.message || 'Unknown'));
          return;
        }
      }
      
      if (!token) {
        setAuthStage('error');
        setAuthError('No session found. Open through Telegram.');
        return;
      }

      setSessionToken(token);
      setAuthStage('loading-player');
      
      // Set 3 second timeout for session validation
      authTimeoutRef.current = setTimeout(() => {
        console.log('[Auth] Session validation timeout');
        setAuthStage('error');
        setAuthError('Session validation timeout. Please retry.');
      }, 3000);
      
    } catch (err: any) {
      console.log('[Auth] checkAuth error:', err.message);
      setAuthStage('error');
      setAuthError(err?.message || 'Authentication failed');
    }
  }, [verifyMutation]);

  // Initial auth check after Telegram is ready
  useEffect(() => {
    if (tgReady) {
      console.log('[Auth] Telegram ready, starting auth...');
      checkAuth();
    }
  }, [tgReady]);

  // Handle session validation result
  useEffect(() => {
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current);
      authTimeoutRef.current = null;
    }

    if (authStage !== 'loading-player') return;
    
    if (sessionUser === undefined) {
      // Still loading, wait
      return;
    }
    
    if (sessionUser === null) {
      // Token invalid or expired
      console.log('[Auth] Session invalid, clearing...');
      localStorage.removeItem('wd_session_token');
      setSessionToken(null);
      setAuthStage('error');
      setAuthError('Session expired. Please reopen the app.');
      return;
    }

    // Session valid
    console.log('[Auth] Session valid, ready!');
    setAuthStage('ready');
  }, [sessionUser, authStage]);

  const value: AuthContextType = {
    isAuthenticated: authStage === 'ready',
    authStage,
    authError,
    user: sessionUser?.user as User | null,
    player: sessionUser?.player as Player | null,
    sessionToken,
    logout,
    retry,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}