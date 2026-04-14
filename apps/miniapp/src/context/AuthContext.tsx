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
const API = 'https://peaceful-scorpion-529.convex.site';

async function apiPost(path: string, body: object) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `HTTP ${res.status}`);
  }
  return res.json();
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
        throw new Error('Invalid session response');
      }
    } catch (err: any) {
      console.error('[Auth] Session load error:', err.message);
      // Don't clear token on error - let user retry
      setState('error');
      setError('Session check failed. Please try again.');
    }
  }, []);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    async function boot() {
      try {
        // Check stored token
        const stored = localStorage.getItem(TOKEN_KEY);
        if (stored) {
          setToken(stored);
          await loadSession(stored);
          return;
        }

        // Wait for Telegram WebApp SDK
        let tg = (window as any).Telegram?.WebApp;
        if (!tg) {
          let tries = 0;
          await new Promise<void>((resolve) => {
            const t = setInterval(() => {
              tries++;
              tg = (window as any).Telegram?.WebApp;
              if (tg || tries >= 30) {
                clearInterval(t);
                resolve();
              }
            }, 100);
          });
        }

        tg = (window as any).Telegram?.WebApp;

        if (!tg) {
          setState('error');
          setError('Open this app via your Telegram bot.');
          return;
        }

        tg.ready();
        tg.expand();

        const initData = tg.initData;

        if (!initData || initData.trim() === '') {
          setState('error');
          setError(
            'No Telegram data detected. ' +
            'Please open via the bot button, not a direct link.'
          );
          return;
        }

        // Authenticate via HTTP endpoint
        const data = await apiPost('/auth/telegramVerify', {
          args: { initData },
        });

        if (!data.success || !data.token) {
          setState('error');
          setError(data.message || 'Authentication failed.');
          return;
        }

        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
        setPlayer(data.player);
        setState('ready');

      } catch (err: any) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setState('error');
        setError(err?.message || 'Authentication failed.');
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
        retry,
        warBonds,
        commandPoints,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}