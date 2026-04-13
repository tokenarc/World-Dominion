import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type AuthState = 'loading' | 'checking' | 'authenticating' | 'ready' | 'unauthenticated' | 'error';

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
  state: 'loading',
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

async function callAuthApi(path: string, args: any): Promise<any> {
  const url = '/api/auth';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, args }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err: any) {
    throw new Error(err.message || 'Request failed');
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [player, setPlayer] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('wd_token');
    if (stored) {
      setToken(stored);
      setState('checking');
    } else {
      const urlInitData = getInitDataFromUrl();
      if (urlInitData) {
        setState('authenticating');
        doAuth(urlInitData);
      } else {
        setState('unauthenticated');
      }
    }
  }, []);

  async function doAuth(initData: string) {
    try {
      const result = await callAuthApi('/auth/telegramVerify', { initData });
      if (result?.success && result?.token) {
        try { localStorage.setItem('wd_token', result.token); } catch {}
        setToken(result.token);
        setUser(result.user);
        setPlayer(result.player);
        setState('ready');
      } else {
        setError(result?.message || 'Auth failed');
        setState('error');
      }
    } catch (err: any) {
      setError(err.message || 'Auth failed');
      setState('error');
    }
  }

  useEffect(() => {
    if (state === 'checking' && token) {
      callAuthApi('/auth/getSessionUser', { token })
        .then((res) => {
          if (res === null || !res?.user) {
            try { localStorage.removeItem('wd_token'); } catch {}
            setToken(null);
            setUser(null);
            setPlayer(null);
            setState('unauthenticated');
          } else {
            setUser(res.user);
            setPlayer(res.player);
            setState('ready');
          }
        })
        .catch(() => {
          setState('unauthenticated');
        });
    }
  }, [state, token]);

  const logout = () => {
    try { localStorage.removeItem('wd_token'); } catch {}
    setToken(null);
    setUser(null);
    setPlayer(null);
    setState('unauthenticated');
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