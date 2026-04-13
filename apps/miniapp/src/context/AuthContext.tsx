import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type AuthState = 'initializing' | 'authenticating' | 'authenticated' | 'unauthenticated' | 'error';

interface AuthContextType {
  state: AuthState;
  error: string | null;
  user: any;
  player: any;
  token: string | null;
  logout: () => void;
  balance: { warBonds: number; commandPoints: number };
}

export const AuthContext = createContext<AuthContextType>({
  state: 'initializing',
  error: null,
  user: null,
  player: null,
  token: null,
  logout: () => {},
  balance: { warBonds: 0, commandPoints: 0 },
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useBalance() {
  const { player } = useAuth();
  return {
    warBonds: player?.stats?.warBonds ?? 0,
    commandPoints: player?.stats?.commandPoints ?? 0,
  };
}

const AUTH_TIMEOUT_MS = 8000;

function getInitDataFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const hash = window.location.hash;
    if (!hash) return null;
    const params = new URLSearchParams(hash.substring(1));
    const initData = params.get('tgWebAppData');
    return initData ? decodeURIComponent(initData) : null;
  } catch { return null; }
}

async function callAuthApi(path: string, args: any, timeout = AUTH_TIMEOUT_MS): Promise<any> {
  const url = '/api/auth';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, args }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }
    return await response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Auth request timeout');
    }
    throw err;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [player, setPlayer] = useState<any>(null);
  const [initFailed, setInitFailed] = useState(false);

  useEffect(() => {
    if (initFailed) return;
    
    const stored = localStorage.getItem('wd_token');
    
    const doInit = async () => {
      const timeoutId = setTimeout(() => {
        setError('Initialization timeout - please reopen from Telegram');
        setState('error');
      }, AUTH_TIMEOUT_MS);
      
      try {
        if (stored) {
          setToken(stored);
          setState('authenticating');
          
          const sessionRes = await callAuthApi('/auth/getSessionUser', { token: stored });
          
          if (sessionRes && sessionRes.user && !sessionRes.error) {
            setUser(sessionRes.user);
            setPlayer(sessionRes.player);
            setState('authenticated');
          } else {
            localStorage.removeItem('wd_token');
            const urlInitData = getInitDataFromUrl();
            if (urlInitData) {
              setState('authenticating');
              const authRes = await callAuthApi('/auth/telegramVerify', { initData: urlInitData });
              if (authRes.success && authRes.token) {
                localStorage.setItem('wd_token', authRes.token);
                setToken(authRes.token);
                setUser(authRes.user);
                setPlayer(authRes.player);
                setState('authenticated');
              } else {
                setError(authRes.message || 'Auth failed');
                setState('unauthenticated');
              }
            } else {
              setState('unauthenticated');
            }
          }
        } else {
          const urlInitData = getInitDataFromUrl();
          if (urlInitData) {
            setState('authenticating');
            const authRes = await callAuthApi('/auth/telegramVerify', { initData: urlInitData });
            if (authRes.success && authRes.token) {
              localStorage.setItem('wd_token', authRes.token);
              setToken(authRes.token);
              setUser(authRes.user);
              setPlayer(authRes.player);
              setState('authenticated');
            } else {
              setError(authRes.message || 'Auth failed');
              setState('unauthenticated');
            }
          } else {
            setState('unauthenticated');
          }
        }
      } catch (err: any) {
        console.error('[Auth] Init error:', err.message);
        setError(err.message || 'Auth failed');
        setState('error');
      } finally {
        clearTimeout(timeoutId);
      }
    };
    
    doInit();
    
    return () => {};
  }, [initFailed]);

  const logout = () => {
    try { localStorage.removeItem('wd_token'); } catch {}
    setToken(null);
    setUser(null);
    setPlayer(null);
    setState('unauthenticated');
    setError(null);
  };

  const balance = {
    warBonds: player?.stats?.warBonds ?? 0,
    commandPoints: player?.stats?.commandPoints ?? 0,
  };

  return (
    <AuthContext.Provider value={{ state, error, user, player, token, logout, balance }}>
      {children}
    </AuthContext.Provider>
  );
}