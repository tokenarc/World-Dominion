import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';

type AuthState = 'loading' | 'ready' | 'error';

interface AuthContextType {
  state: AuthState;
  error: string | null;
  user: any;
  player: any;
  token: string | null;
  logout: () => void;
  retry: () => void;
  warBonds: number;
  commandPoints: number;
}

const AuthContext = createContext<AuthContextType>({
  state: 'loading',
  error: null,
  user: null,
  player: null,
  token: null,
  logout: () => {},
  retry: () => {},
  warBonds: 0,
  commandPoints: 0,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useBalance() {
  const { warBonds, commandPoints } = useContext(AuthContext);
  return { warBonds, commandPoints };
}

const TOKEN_KEY = 'wd_token';
const API = 'https://peaceful-scorpion-529.convex.cloud';
const API_TIMEOUT = 10000;
const DEV_MODE = process.env.NODE_ENV !== 'production';

async function apiPost(path: string, body: object) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  try {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err: any) {
    if (err.name === 'AbortError' || err.message?.includes('abort')) {
      throw new Error('Request timeout - server not responding');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForTelegram(timeout = 5000) {
  return new Promise((resolve) => {
    const start = Date.now();
    function check() {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        return resolve(tg);
      }
      if (Date.now() - start > timeout) {
        return resolve(null);
      }
      setTimeout(check, 100);
    }
    check();
  });
}

async function waitForInitData(tg, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function check() {
      const data = tg.initData || tg.initDataUnsafe?.initData;
      if (data && data.length > 0) {
        return resolve(data);
      }
      if (Date.now() - start > timeout) {
        reject(new Error("No initData"));
      }
      setTimeout(check, 100);
    }
    check();
  });
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<AuthState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [player, setPlayer] = useState<any>(null);
  const attempted = useRef(false);

  const loadSession = useCallback(async (tok: string) => {
    try {
      const data = await apiPost('/auth/getSessionUser', {
        args: { token: tok },
      });
      if (data.user && data.player) {
        setUser(data.user);
        setPlayer(data.player);
        setState('ready');
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setState('error');
        setError('Session invalid. Please re-authenticate via Telegram.');
      }
    } catch (err: any) {
      console.error('[Auth] Session load error:', err.message);
      localStorage.removeItem(TOKEN_KEY);
      setState('error');
      setError('Session check failed. Please try again.');
    }
  }, []);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    async function boot() {
      try {
        const stored = localStorage.getItem(TOKEN_KEY);
        if (stored) {
          setToken(stored);
          await loadSession(stored);
          return;
        }

        const tg = await waitForTelegram() as any;
        console.log("[Auth] Telegram:", tg ? 'detected' : 'not found');
        
        if (!tg) {
          if (DEV_MODE) {
            console.warn("[DEV] Guest session active - no Telegram detected");
            setState('ready');
            setUser({ id: 'guest', isGuest: true, firstName: 'Guest' });
            setPlayer({ stats: { warBonds: 0, commandPoints: 0, reputation: 0 } });
            return;
          }
          setState('error');
          setError('Authentication required. Open via your Telegram bot.');
          return;
        }

        (tg as any).ready();
        (tg as any).expand();

        console.log("[Auth] Telegram detected, waiting for initData...");
        
        let initData;
        try {
          initData = await waitForInitData(tg);
        } catch (err: any) {
          console.error("[Auth] waitForInitData failed:", err.message);
          console.log("[Auth] tg.initData:", tg.initData);
          console.log("[Auth] tg.initDataUnsafe:", tg.initDataUnsafe);
          if (DEV_MODE) {
            console.warn("[DEV] Guest session active - no initData");
            setState('ready');
            setUser({ id: 'guest', isGuest: true, firstName: 'Guest' });
            setPlayer({ stats: { warBonds: 0, commandPoints: 0, reputation: 0 } });
            return;
          }
          setState('error');
          setError('Telegram session invalid. Please reopen from bot.');
          return;
        }

        console.log("[Auth] initData received (first 50 chars):", initData?.slice(0, 50));

        console.log("[Auth] Sending to backend:", { initData: initData?.slice(0, 50) + "..." });

        const data = await apiPost('/auth/telegramVerify', {
          args: { initData },
        });

        console.log("[Auth] Backend response:", data);

        if (!data.success || !data.token) {
          console.error("[Auth] Backend verification failed:", data.message || data.error);
          setState('error');
          setError(data.message || 'Authentication failed. Please try again.');
          return;
        }

        console.log("[Auth] Verification success, user:", data.user);

        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
        setPlayer(data.player);
        setState('ready');

      } catch (err: any) {
        console.error('[Auth] Auth error:', err.message);
        if (DEV_MODE) {
          console.warn("[DEV] Guest session active - auth error:", err.message);
          setState('ready');
          setUser({ id: 'guest', isGuest: true, firstName: 'Guest' });
          setPlayer({ stats: { warBonds: 0, commandPoints: 0, reputation: 0 } });
          return;
        }
        localStorage.removeItem(TOKEN_KEY);
        setState('error');
        setError('Authentication failed. Please reopen from Telegram.');
      }
    }

    boot();
  }, [loadSession]);

  const retry = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setPlayer(null);
    setState('loading');
    setError(null);
    attempted.current = false;
    window.location.reload();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setPlayer(null);
    setState('loading');
    setError(null);
    attempted.current = false;
    window.location.reload();
  }, []);

  const warBonds = player?.stats?.warBonds ?? 0;
  const commandPoints = player?.stats?.commandPoints ?? 0;

  return (
    <AuthContext.Provider
      value={{
        state,
        error,
        user,
        player,
        token,
        logout,
        retry,
        warBonds,
        commandPoints,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}