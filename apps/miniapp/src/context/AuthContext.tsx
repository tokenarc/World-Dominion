import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

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
const CONVEX_SITE = 'https://peaceful-scorpion-529.convex.site';

function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isClient = useIsClient();
  const [state, setState] = useState<AuthState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const attempted = useRef(false);

  // ONLY call useQuery when on client
  const sessionData = isClient ? useQuery(
    api.auth.getSessionUser,
    token ? { token } : 'skip'
  ) : undefined;

  useEffect(() => {
    if (!isClient || attempted.current) return;
    attempted.current = true;

    async function boot() {
      try {
        // Check stored token first
        const stored = localStorage.getItem(TOKEN_KEY);
        if (stored) {
          setToken(stored);
          // sessionData query will validate it
          return;
        }
        // Wait for Telegram SDK
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

        if (!initData) {
          setState('error');
          setError('No Telegram data. Open via the bot button.');
          return;
        }

        // Call Convex HTTP endpoint directly (no conditional hooks)
        const res = await fetch(`${CONVEX_SITE}/auth/telegramVerify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ args: { initData } }),
        });

        const data = await res.json();

        if (!res.ok || !data.success || !data.token) {
          setState('error');
          setError(data.message || 'Auth failed. Try again.');
          return;
        }

        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);

      } catch (err: any) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setState('error');
        setError(err?.message || 'Authentication failed.');
      }
    }

boot();
  }, [isClient]);

  // Handle session validation result
  useEffect(() => {
    if (!isClient) return;
    if (sessionData === undefined) return;
    if (sessionData === null) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setState('error');
      setError('Session expired. Please reopen the app.');
      return;
    }
    setState('ready');
    setError(null);
  }, [isClient, sessionData]);

  const retry = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setState('loading');
    setError(null);
    attempted.current = false;
    window.location.reload();
  };

  // Only access sessionData after we're on client and have attempted auth
  const warBonds = isClient && sessionData ? sessionData?.player?.stats?.warBonds ?? 0 : 0;
  const commandPoints = isClient && sessionData ? sessionData?.player?.stats?.commandPoints ?? 0 : 0;
  const user = isClient && sessionData ? sessionData?.user : null;
  const player = isClient && sessionData ? sessionData?.player : null;

  // Show loading state until client-side auth completes
  if (!isClient) {
    return (
      <AuthContext.Provider
        value={{
          state: 'loading',
          error: null,
          user: null,
          player: null,
          token: null,
          retry,
          warBonds: 0,
          commandPoints: 0,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

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