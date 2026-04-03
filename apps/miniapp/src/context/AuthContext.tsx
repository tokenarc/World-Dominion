import React, { createContext, useContext, useEffect, useState } from 'react';

export type AuthStage = 'init' | 'authenticating' | 'loading-player' | 'ready' | 'error';

interface TelegramUser {
  id: string; telegramId: number | string;
  firstName: string; lastName: string; username: string; email: string;
}
interface Player {
  userId: string; telegramId: number | string; username: string;
  firstName: string; lastName: string; nationId: string; currentNation: string;
  role: string; currentRole: string;
  wallet: { warBonds: number; commandPoints: number };
  stats: { totalScore: number; warBonds: number; commandPoints: number; reputation: number; militaryKnowledge: number };
  reputation: number; kycVerified: boolean; joinedAt: number; lastActive: number;
}
interface AuthContextType {
  isAuthenticated: boolean; authStage: AuthStage; authError: string | null;
  user: TelegramUser | null; player: Player | null; token: string | null;
  logout: () => void; retry: () => void;
}

const API_BASE  = 'https://world-dominion.onrender.com';
const TOKEN_KEY = 'wd_auth_token';
const USER_KEY  = 'wd_user_data';
const FETCH_TIMEOUT_MS = 55_000;

function fetchWithTimeout(url: string, opts: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(id));
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false, authStage: 'init', authError: null,
  user: null, player: null, token: null, logout: () => {}, retry: () => {},
});

export const useAuth = () => useContext(AuthContext);

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
        // Wake Render backend from cold start in background
        fetchWithTimeout(`${API_BASE}/ping`, { method: 'GET' }, 60_000).catch(() => {});

        const tg = (typeof window !== 'undefined') ? window.Telegram?.WebApp : null;
        if (tg) { tg.ready(); tg.expand(); }

        const initData    = tg?.initData || '';
        const cachedToken = localStorage.getItem(TOKEN_KEY);
        const cachedUser  = localStorage.getItem(USER_KEY);

        console.log('[AUTH] initData:', initData.length, 'cachedToken:', !!cachedToken);

        // Fast path: valid cached token
        if (cachedToken && cachedUser) {
          try {
            const verifyRes = await fetchWithTimeout(
              `${API_BASE}/api/auth/verify-token`,
              { method: 'POST', headers: { Authorization: `Bearer ${cachedToken}`, 'Content-Type': 'application/json' } },
              15_000
            );
            if (verifyRes.ok) {
              const parsed = JSON.parse(cachedUser) as TelegramUser;
              setToken(cachedToken); setUser(parsed); setIsAuthenticated(true);
              setAuthStage('loading-player');
              try {
                const pr = await fetchWithTimeout(`${API_BASE}/api/player/me`, { headers: { Authorization: `Bearer ${cachedToken}` } }, 20_000);
                if (pr.ok) { const pd = await pr.json(); setPlayer(pd.player); }
              } catch { /* non-fatal */ }
              setAuthStage('ready');
              return;
            }
          } catch { console.log('[AUTH] cached token expired, doing full auth'); }
        }

        if (!initData) {
          setAuthError('Open this app through Telegram');
          setAuthStage('error');
          return;
        }

        const authRes  = await fetchWithTimeout(
          `${API_BASE}/api/auth/telegram-verify`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initData }) },
          FETCH_TIMEOUT_MS
        );
        const authData = await authRes.json();

        if (!authRes.ok || !authData.success) throw new Error(authData.error || 'Authentication failed');

        localStorage.setItem(TOKEN_KEY, authData.token);
        localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
        setToken(authData.token); setUser(authData.user);
        setAuthStage('loading-player');

        if (authData.player) {
          setPlayer(authData.player);
        } else {
          try {
            const pr = await fetchWithTimeout(`${API_BASE}/api/player/me`, { headers: { Authorization: `Bearer ${authData.token}` } }, 20_000);
            if (pr.ok) { const pd = await pr.json(); setPlayer(pd.player); }
          } catch { /* non-fatal */ }
        }

        setIsAuthenticated(true);
        setAuthStage('ready');

      } catch (err: any) {
        console.error('[AuthContext]', err);
        const msg = err.name === 'AbortError'
          ? 'Server is waking up — tap Retry in a moment'
          : (err.message || 'Authentication failed');
        setAuthError(msg);
        setAuthStage('error');
        setIsAuthenticated(false);
      }
    };
    authenticate();
  }, [retryTrigger]);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY);
    setToken(null); setUser(null); setPlayer(null);
    setIsAuthenticated(false); setAuthStage('init');
  };
  const retry = () => { setAuthStage('init'); setAuthError(null); setRetryTrigger(n => n + 1); };

  return (
    <AuthContext.Provider value={{ isAuthenticated, authStage, authError, user, player, token, logout, retry }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
