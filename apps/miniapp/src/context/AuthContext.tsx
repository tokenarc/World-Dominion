import {
  createContext, useContext, useEffect, useState, useRef
} from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

type AuthState = 'loading' | 'ready' | 'error';

interface AuthContextType {
  state: AuthState;
  error: string | null;
  user: any;
  player: any;
  token: string | null;
  logout: () => void;
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
  warBonds: 0,
  commandPoints: 0,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useBalance() {
  const { player } = useContext(AuthContext);
  return {
    warBonds: player?.stats?.warBonds ?? 0,
    commandPoints: player?.stats?.commandPoints ?? 0,
  };
}

const TOKEN_KEY = 'wd_token';

function useClientOnly() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isClient = useClientOnly();
  const [state, setState] = useState<AuthState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const attempted = useRef(false);

  const verifyMutation = isClient ? useMutation(api.auth.telegramVerify) : null;
  const sessionUser = isClient && token 
    ? useQuery(api.auth.getSessionUser, { token }) 
    : undefined;

  useEffect(() => {
    if (!isClient || !verifyMutation || attempted.current) return;
    attempted.current = true;

    async function authenticate() {
      try {
        const stored = localStorage.getItem(TOKEN_KEY);
        if (stored) {
          setToken(stored);
          return;
        }

        let tg = (window as any).Telegram?.WebApp;
        if (!tg) {
          await new Promise<void>((resolve) => {
            let attempts = 0;
            const interval = setInterval(() => {
              attempts++;
              tg = (window as any).Telegram?.WebApp;
              if (tg || attempts > 20) {
                clearInterval(interval);
                resolve();
              }
            }, 100);
          });
        }

        tg = (window as any).Telegram?.WebApp;

        if (!tg) {
          setState('error');
          setError('Open this app through your Telegram bot.');
          return;
        }

        tg.ready();
        tg.expand();

        const initData = tg.initData;

        if (!initData || initData.trim() === '') {
          setState('error');
          setError(
            'No Telegram data received. ' +
            'Open via the bot, not a direct link.'
          );
          return;
        }

        if (!verifyMutation) {
          setState('error');
          setError('Auth not available');
          return;
        }

        const result = await verifyMutation({ initData });

        if (!result?.token) {
          setState('error');
          setError('Authentication failed. Please try again.');
          return;
        }

        localStorage.setItem(TOKEN_KEY, result.token);
        setToken(result.token);

      } catch (err: any) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setState('error');
        setError(err?.message || 'Authentication failed.');
      }
    }

    authenticate();
  }, [isClient, verifyMutation]);

  useEffect(() => {
    if (!isClient) return;
    if (sessionUser === undefined) return;
    if (sessionUser === null) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setState('error');
      setError('Session expired. Please reopen the app.');
      return;
    }
    setState('ready');
  }, [isClient, sessionUser]);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setState('loading');
    attempted.current = false;
  };

  const warBonds = sessionUser?.player?.stats?.warBonds ?? 0;
  const commandPoints = sessionUser?.player?.stats?.commandPoints ?? 0;

  return (
    <AuthContext.Provider
      value={{
        state,
        error,
        user: sessionUser?.user ?? null,
        player: sessionUser?.player ?? null,
        token,
        logout,
        warBonds,
        commandPoints,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}