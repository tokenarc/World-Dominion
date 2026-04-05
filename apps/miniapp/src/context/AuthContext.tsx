import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  return isBrowser() && typeof api?.auth?.getSessionUser === 'function';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [authStage, setAuthStage] = useState<AuthStage>('init');
  const [authError, setAuthError] = useState<string | null>(null);

  const sessionUser = hasApi() 
    ? useQuery(api.auth.getSessionUser as any, sessionToken ? { token: sessionToken } : 'skip')
    : null;

  const verifyMutation = hasApi() ? useMutation(api.auth.telegramVerify as any) : null;
  const logoutMutation = hasApi() ? useMutation(api.auth.logout as any) : null;

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
    setAuthStage('init');
    setAuthError(null);
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    if (!isBrowser()) return;
    
    try {
      setAuthStage('authenticating');
      
      const tg = (window as any).Telegram?.WebApp;
      console.log('[Auth] Telegram.WebApp available:', !!tg);
      console.log('[Auth] initData available:', !!tg?.initData);
      console.log('[Auth] initData length:', tg?.initData?.length || 0);
      
      let token = localStorage.getItem('wd_session_token');
      console.log('[Auth] Stored token:', !!token);
      
      if (!token && tg?.initData) {
        console.log('[Auth] Calling verifyMutation with initData length:', tg.initData.length);
        if (!verifyMutation) {
          console.log('[Auth] ERROR: verifyMutation is null!');
        } else {
          try {
            const result = await verifyMutation({ initData: tg.initData });
            console.log('[Auth] verifyMutation result:', result);
            if (result?.success) {
              token = result.token;
              localStorage.setItem('wd_session_token', token);
              console.log('[Auth] Token saved to localStorage');
            }
          } catch (mutErr: any) {
            console.log('[Auth] verifyMutation error:', mutErr.message);
          }
        }
      }
      
      if (!token) {
        setAuthStage('error');
        setAuthError('No session found. Open through Telegram.');
        return;
      }
      
      setSessionToken(token);
      setAuthStage('loading-player');
    } catch (err: any) {
      console.log('[Auth] checkAuth error:', err.message);
      setAuthStage('error');
      setAuthError(err?.message || 'Authentication failed');
    }
  }, [verifyMutation]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (sessionUser) {
      setAuthStage('ready');
    }
  }, [sessionUser]);

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
