import React, { createContext, useContext, useEffect, useState } from 'react';

// ── Types ────────────────────────────────────────────────────
export type AuthStage =
  | 'init'
  | 'authenticating'
  | 'loading-player'
  | 'ready'
  | 'error';

interface TelegramUser {
  id: string;
  telegramId: number | string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

interface PlayerStats {
  totalScore: number;
  warBonds: number;
  commandPoints: number;
  reputation: number;
  militaryKnowledge: number;
  nation?: string;
  role?: string;
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
  stats: PlayerStats;
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
  token: string | null;
  logout: () => void;
  retry: () => void;
}

// ── Constants ────────────────────────────────────────────────
const API_BASE    = 'https://world-dominion.onrender.com';
const TOKEN_KEY   = 'wd_auth_token';
const USER_KEY    = 'wd_user_data';

// ── Context ──────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  authStage:       'init',
  authError:       null,
  user:            null,
  player:          null,
  token:           null,
  logout:          () => {},
  retry:           () => {},
});

export const useAuth = () => useContext(AuthContext);

// ── Provider ─────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authStage,       setAuthStage]       = useState<AuthStage>('init');
  const [authError,       setAuthError]       = useState<string | null>(null);
  const [user,            setUser]            = useState<TelegramUser | null>(null);
  const [player,          setPlayer]          = useState<Player | null>(null);
  const [token,           setToken]           = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [retryTrigger,    setRetryTrigger]    = useState(0);

  useEffect(() => {
    const authenticate = async () => {
      setAuthStage('authenticating');
      setAuthError(null);

      try {
        const tg = window.Telegram?.WebApp;

        // Init Telegram WebApp
        if (tg) {
          tg.ready();
          tg.expand();
        }

        const initData = tg?.initData;

        // ── Full auth: Telegram initData always ────────────
        if (!initData) {
          // Dev mode fallback — not in Telegram
          setAuthError('Open this app through Telegram');
          setAuthStage('error');
          return;
        }

        const authRes = await fetch(`${API_BASE}/api/auth/telegram-verify`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ initData }),
        });

        const authData = await authRes.json();

        if (!authRes.ok || !authData.success) {
          throw new Error(authData.error || 'Authentication failed');
        }

        // Store token + user for fast path next time
        localStorage.setItem(TOKEN_KEY, authData.token);
        localStorage.setItem(USER_KEY, JSON.stringify(authData.user));

        setToken(authData.token);
        setUser(authData.user);
        setPlayer(authData.player);
        setIsAuthenticated(true);
        setAuthStage('ready');

      } catch (err: any) {
        console.error('[AuthContext]', err);
        setAuthError(err.message || 'Authentication failed');
        setAuthStage('error');
        setIsAuthenticated(false);
      }
    };

    authenticate();
  }, [retryTrigger]);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setPlayer(null);
    setIsAuthenticated(false);
    setAuthStage('init');
  };

  const retry = () => setRetryTrigger(n => n + 1);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      authStage,
      authError,
      user,
      player,
      token,
      logout,
      retry,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
