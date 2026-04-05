import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/client';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [authStage, setAuthStage] = useState<AuthStage>('init');
  const [authError, setAuthError] = useState<string | null>(null);

  const sessionUser = useQuery(
    api.auth.getSessionUser,
    sessionToken ? { token: sessionToken } : 'skip'
  ) as any;

  const verifyMutation = useMutation(api.auth.telegramVerify) as any;
  const logoutMutation = useMutation(api.auth.logout) as any;

  const logout = useCallback(() => {
    if (sessionToken) {
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
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setAuthStage('authenticating');
      
      let token = localStorage.getItem('wd_session_token');
      
      if (!token) {
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.initData) {
          const result = await verifyMutation({ initData: tg.initData });
          if (result.success) {
            token = result.token;
            localStorage.setItem('wd_session_token', token);
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
      setAuthStage('error');
      setAuthError(err.message || 'Authentication failed');
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

function KeepAlive() {
  useEffect(() => {
    const ping = () => {
      fetch('/api/ping', { method: 'HEAD' }).catch(() => {});
    };
    const interval = setInterval(ping, 60000);
    return () => clearInterval(interval);
  }, []);
  return null;
}

export { KeepAlive };
