import { createContext, useContext, useState, useEffect, ReactNode, Component } from 'react';

type AuthState = 'loading' | 'authenticating' | 'ready' | 'error';

interface AuthContextType {
  state: AuthState;
  error: string | null;
  user: any;
  player: any;
  token: string | null;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  state: 'loading',
  error: null,
  user: null,
  player: null,
  token: null,
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
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
    if (stored) setToken(stored);
    setState('authenticating');
  }, []);

  useEffect(() => {
    if (state !== 'authenticating') return;
    const urlInitData = getInitDataFromUrl();
    
    if (!token && !urlInitData) {
      setState('error');
      setError('Open through Telegram bot.');
      return;
    }

    if (token) {
      callAuthApi('/auth/getSessionUser', { token })
        .then((res) => {
          if (res === null) {
            try { localStorage.removeItem('wd_token'); } catch {}
            setToken(null);
            return;
          }
          setUser(res?.user);
          setPlayer(res?.player);
          setState('ready');
        })
        .catch((err: Error) => {
          setState('error');
          setError('Session check failed: ' + err.message);
        });
      return;
    }

    if (urlInitData) {
      callAuthApi('/auth/telegramVerify', { initData: urlInitData })
        .then((res) => {
          if (res?.success && res?.token) {
            try { localStorage.setItem('wd_token', res.token); } catch {}
            setToken(res.token);
            setUser(res?.user);
            setPlayer(res?.player);
            setState('ready');
          } else {
            setState('error');
            setError(res?.message || 'Auth failed');
          }
        })
        .catch((err: Error) => {
          setState('error');
          setError('Auth failed: ' + err.message);
        });
    }
  }, [state, token]);

  const logout = () => {
    try { localStorage.removeItem('wd_token'); } catch {}
    setToken(null);
    setUser(null);
    setPlayer(null);
    setState('loading');
  };

  return (
    <AuthContext.Provider value={{ state, error, user, player, token, logout }}>
      {children}
    </AuthContext.Provider>
  );
}