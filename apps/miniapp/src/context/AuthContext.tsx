import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/client';

export type AuthStage = 'init' | 'authenticating' | 'loading-player' | 'ready' | 'error';

interface TelegramUser {
  id: string;
  telegramId: number | string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

interface Player {
  userId: string;
  telegramId: number | string;
  username: string;
  firstName: string;
  lastName: string;
  nationId: string;
  currentNation: string;
  role: string;
  currentRole: string;
  wallet: { warBonds: number; commandPoints: number };
  stats: { totalScore: number; warBonds: number; commandPoints: number; reputation: number; militaryKnowledge: number };
  reputation: number;
  kycVerified: boolean;
  joinedAt: number;
  lastActive: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  authStage: AuthStage;
  authError: string | null;
  user: TelegramUser | null;
  player: Player | null;
  sessionToken: string | null;
  logout: () => void;
  retry: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  authStage: 'init',
  authError: null,
  user: null,
  player: null,
  sessionToken: null,
  logout: () => {},
  retry: () => {},
});

const TOKEN_KEY = 'wd_session_token';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authStage, setAuthStage] = useState<AuthStage>('init');
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const verifyMutation = useMutation(api.auth.telegramVerify);
  const logoutMutation = useMutation(api.auth.logout);
  const sessionQuery = useQuery(
    api.auth.getSessionUser,
    sessionToken ? { token: sessionToken } : 'skip'
  );

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      setSessionToken(storedToken);
      setAuthStage('loading-player');
    } else {
      setAuthStage('init');
    }
  }, []);

  useEffect(() => {
    if (sessionQuery === undefined) return;
    
    if (sessionQuery === null) {
      if (sessionToken) {
        localStorage.removeItem(TOKEN_KEY);
        setSessionToken(null);
        setIsAuthenticated(false);
        setAuthStage('init');
      }
      return;
    }

    if (sessionQuery.user && sessionQuery.player) {
      setUser(sessionQuery.user as unknown as TelegramUser);
      setPlayer(sessionQuery.player as unknown as Player);
      setIsAuthenticated(true);
      setAuthStage('ready');
      setAuthError(null);
    }
  }, [sessionQuery, sessionToken]);

  useEffect(() => {
    const authenticate = async () => {
      if (sessionToken) return;

      setAuthStage('authenticating');
      setAuthError(null);

      try {
        const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
        if (tg) {
          tg.ready();
          tg.expand();
        }

        const initData = tg?.initData || '';
        if (!initData) {
          setAuthError('Open this app through Telegram');
          setAuthStage('error');
          return;
        }

        const result = await verifyMutation({ initData });

        localStorage.setItem(TOKEN_KEY, result.token);
        setSessionToken(result.token);
        setUser({
          id: String(result.user.id),
          telegramId: result.user.id,
          firstName: result.user.firstName,
          lastName: result.user.lastName || '',
          username: result.user.username || '',
          email: '',
        });
        setPlayer(result.player as unknown as Player);
        setIsAuthenticated(true);
        setAuthStage('ready');
      } catch (err: unknown) {
        console.error('[AuthContext]', err);
        const message = err instanceof Error ? err.message : 'Authentication failed';
        setAuthError(message);
        setAuthStage('error');
        setIsAuthenticated(false);
      }
    };

    if (authStage === 'init' || retryTrigger > 0) {
      authenticate();
    }
  }, [retryTrigger, sessionToken, verifyMutation]);

  const logout = async () => {
    if (sessionToken) {
      try {
        await logoutMutation({ token: sessionToken });
      } catch {
        // ignore errors
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    setSessionToken(null);
    setUser(null);
    setPlayer(null);
    setIsAuthenticated(false);
    setAuthStage('init');
    setAuthError(null);
  };

  const retry = () => {
    setAuthStage('init');
    setAuthError(null);
    setRetryTrigger(n => n + 1);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        authStage,
        authError,
        user,
        player,
        sessionToken,
        logout,
        retry,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;