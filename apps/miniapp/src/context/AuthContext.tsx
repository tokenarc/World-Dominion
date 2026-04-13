import {
  createContext, useContext, useEffect, useState, useRef
} from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

type AuthState = 'checking' | 'authenticating' | 'authenticated' | 'unauthenticated' | 'error';

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
  state: 'checking',
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
  const { player } = useContext(AuthContext);
  return {
    warBonds: player?.stats?.warBonds ?? 0,
    commandPoints: player?.stats?.commandPoints ?? 0,
  };
}

const TOKEN_KEY = 'wd_token';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    )
  ]);
}

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
  const [state, setState] = useState<AuthState>('checking');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const attempted = useRef(false);
  const forceExitTimer = useRef<NodeJS.Timeout | null>(null);

  const telegramVerifyFn = isClient ? api.auth?.telegramVerify : undefined;
  const getSessionUserFn = isClient ? api.auth?.getSessionUser : undefined;
  
  const verifyMutation = telegramVerifyFn ? useMutation(telegramVerifyFn) : null;
  const sessionUser = getSessionUserFn && token 
    ? useQuery(getSessionUserFn, { token }) 
    : undefined;

  const clearForceExitTimer = () => {
    if (forceExitTimer.current) {
      clearTimeout(forceExitTimer.current);
      forceExitTimer.current = null;
    }
  };

  const forceExit = (errMsg: string) => {
    console.error("AUTH FORCE EXIT:", errMsg);
    clearForceExitTimer();
    setState('error');
    setError(errMsg);
  };

  useEffect(() => {
    if (state === 'checking' || state === 'authenticating') {
      forceExitTimer.current = setTimeout(() => {
        forceExit("Auth timeout. Please restart.");
      }, 10000);
    } else {
      clearForceExitTimer();
    }
    return () => clearForceExitTimer();
  }, [state]);

  useEffect(() => {
    if (!isClient || !verifyMutation || attempted.current) return;
    attempted.current = true;
    console.log("[Auth] Starting authentication flow...");

    async function authenticate() {
      try {
        setState('authenticating');
        console.log("[Auth] State: authenticating");

        const stored = localStorage.getItem(TOKEN_KEY);
        if (stored) {
          console.log("[Auth] Found stored token, setting...");
          setToken(stored);
          setState('authenticated');
          console.log("[Auth] State: authenticated (stored token)");
          return;
        }

        console.log("[Auth] Waiting for Telegram SDK...");
        let tg = (window as any).Telegram?.WebApp;
        
        if (!tg) {
          await withTimeout(
            new Promise<void>((resolve) => {
              let attempts = 0;
              const interval = setInterval(() => {
                attempts++;
                tg = (window as any).Telegram?.WebApp;
                if (tg || attempts > 30) {
                  clearInterval(interval);
                  resolve();
                }
              }, 100);
            }),
            5000
          ).catch(() => {
            console.warn("[Auth] Telegram SDK wait timeout");
          });
        }

        tg = (window as any).Telegram?.WebApp;

        if (!tg) {
          forceExit("Telegram SDK not found. Open via bot.");
          return;
        }

        console.log("[Auth] Telegram SDK found, initializing...");
        tg.ready();
        tg.expand();

        const initData = tg.initData;
        console.log("[Auth] initData present:", !!initData);

        if (!initData || initData.trim() === '') {
          forceExit("No Telegram data. Open via bot link.");
          return;
        }

        if (!verifyMutation) {
          forceExit("Auth mutation not available");
          return;
        }

        console.log("[Auth] Calling telegramVerify...");
        const result = await withTimeout(verifyMutation({ initData }), 10000);

        console.log("[Auth] telegramVerify result:", !!result);

        if (!result?.token) {
          forceExit("Authentication failed. Please retry.");
          return;
        }

        console.log("[Auth] Token received, storing...");
        localStorage.setItem(TOKEN_KEY, result.token);
        setToken(result.token);
        setState('authenticated');
        console.log("[Auth] State: authenticated");

      } catch (err: any) {
        console.error("[Auth] Exception:", err.message);
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        forceExit(err?.message || "Authentication failed");
      }
    }

    authenticate();
  }, [isClient, verifyMutation]);

  useEffect(() => {
    if (!isClient) return;
    
    console.log("[Auth] Session check:", sessionUser);

    if (sessionUser === undefined) {
      return;
    }

    if (sessionUser === null) {
      console.log("[Auth] Session invalid, clearing...");
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setState('unauthenticated');
      setError("Session expired. Please reopen.");
      return;
    }

    setState('authenticated');
    setError(null);
  }, [isClient, sessionUser]);

  const logout = () => {
    console.log("[Auth] Logout called");
    clearForceExitTimer();
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setState('checking');
    setError(null);
    attempted.current = false;
  };

  const retry = () => {
    console.log("[Auth] Retry called");
    logout();
  };

  const warBonds = sessionUser?.player?.stats?.warBonds ?? 0;
  const commandPoints = sessionUser?.player?.stats?.commandPoints ?? 0;

  console.log("[Auth] Provider state:", state, "error:", error);

  return (
    <AuthContext.Provider
      value={{
        state,
        error,
        user: sessionUser?.user ?? null,
        player: sessionUser?.player ?? null,
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