import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

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
const GLOBAL_FAILSAFE_MS = 12000;

function withTimeout<T>(promise: Promise<T>, ms: number = AUTH_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    )
  ]);
}

function getInitDataFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const hash = window.location.hash;
    if (!hash) return null;
    const params = new URLSearchParams(hash.substring(1));
    const initData = params.get('tgWebAppData');
    return initData ? decodeURIComponent(initData) : null;
  } catch (e) { 
    console.error('[Auth] URL parse error:', e);
    return null; 
  }
}

async function callAuthApi(path: string, args: any): Promise<any> {
  const url = '/api/auth';
  console.log('[Auth] API call start:', path);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error('[Auth] API timeout:', path);
    controller.abort();
  }, AUTH_TIMEOUT_MS);
  
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
      console.error('[Auth] API error:', path, response.status, errText);
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[Auth] API result:', path, !!data);
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error('[Auth] API exception:', path, err.message);
    throw err;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [player, setPlayer] = useState<any>(null);
  const initialized = useRef(false);

  const failSafeTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    console.log('[Auth] Starting initialization');
    
    failSafeTimer.current = setTimeout(() => {
      if (state === 'initializing' || state === 'authenticating') {
        console.error('[Auth] Global failsafe triggered');
        setError('Initialization timeout - please reopen from Telegram');
        setState('error');
      }
    }, GLOBAL_FAILSAFE_MS);

    const doInit = async () => {
      try {
        const storedToken = localStorage.getItem('wd_token');
        console.log('[Auth] Stored token exists:', !!storedToken);
        
        if (storedToken) {
          setToken(storedToken);
          setState('authenticating');
          
          console.log('[Auth] Checking session...');
          const sessionRes = await withTimeout(callAuthApi('/auth/getSessionUser', { token: storedToken }));
          console.log('[Auth] Session result:', sessionRes?.error ? sessionRes.error : 'ok');
          
          if (sessionRes.error) {
            console.log('[Auth] Invalid session, clearing');
            localStorage.removeItem('wd_token');
          } else {
            setUser(sessionRes.user);
            setPlayer(sessionRes.player);
            setState('authenticated');
            clearTimeout(failSafeTimer.current);
            console.log('[Auth] Session valid, logged in');
            return;
          }
        }
        
        const urlInitData = getInitDataFromUrl();
        console.log('[Auth] URL initData exists:', !!urlInitData);
        
        if (urlInitData) {
          setState('authenticating');
          
          console.log('[Auth] Authenticating with Telegram...');
          const authRes = await withTimeout(callAuthApi('/auth/telegramVerify', { initData: urlInitData }));
          console.log('[Auth] Auth result:', authRes?.success);
          
          if (authRes.success && authRes.token) {
            localStorage.setItem('wd_token', authRes.token);
            setToken(authRes.token);
            setUser(authRes.user);
            setPlayer(authRes.player);
            setState('authenticated');
            clearTimeout(failSafeTimer.current);
            console.log('[Auth] Auth successful');
          } else {
            console.error('[Auth] Auth failed:', authRes?.message);
            setError(authRes.message || 'Auth failed');
            setState('unauthenticated');
          }
        } else {
          console.log('[Auth] No auth data, unauthenticated');
          setState('unauthenticated');
        }
      } catch (err: any) {
        console.error('[Auth] Init error:', err.message);
        setError(err.message || 'Auth failed');
        setState('error');
      } finally {
        clearTimeout(failSafeTimer.current);
      }
    };
    
    doInit();
    
    return () => {
      clearTimeout(failSafeTimer.current);
    };
  }, []);

  const logout = () => {
    console.log('[Auth] Logout');
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