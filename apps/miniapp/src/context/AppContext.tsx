import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';

type AppState = 'booting' | 'detecting' | 'authenticating' | 'ready' | 'error';
type EnvState = 'checking' | 'telegram' | 'browser';

interface AppContextType {
  appState: AppState;
  env: EnvState;
  error: string | null;
  user: any;
  player: any;
  token: string | null;
  logout: () => void;
  retry: () => void;
  balance: { warBonds: number; commandPoints: number };
}

export const AppContext = createContext<AppContextType>({
  appState: 'booting',
  env: 'checking',
  error: null,
  user: null,
  player: null,
  token: null,
  logout: () => {},
  retry: () => {},
  balance: { warBonds: 0, commandPoints: 0 },
});

export function useApp() {
  return useContext(AppContext);
}

export function useBalance() {
  const { player } = useApp();
  return {
    warBonds: player?.stats?.warBonds ?? 0,
    commandPoints: player?.stats?.commandPoints ?? 0,
  };
}

const TOKEN_KEY = 'wd_token';
const AUTH_TIMEOUT_MS = 8000;

async function waitForTelegramSDK(timeout = 2000): Promise<any> {
  return new Promise((resolve) => {
    const start = Date.now();
    
    function check() {
      const tg = (window as any).Telegram?.WebApp;
      
      console.log('[Env] TG OBJECT:', !!tg);
      
      if (tg) {
        console.log('[Env] Telegram SDK detected!');
        return resolve(tg);
      }
      
      if (Date.now() - start > timeout) {
        console.log('[Env] Telegram SDK timeout - browser mode');
        return resolve(null);
      }
      
      setTimeout(check, 100);
    }
    
    check();
  });
}

async function waitForInitData(tg: any, timeout = 2000): Promise<string> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    
    function check() {
      const initData = tg.initData || tg.initDataUnsafe;
      
      console.log('[Init] Checking initData:', !!initData);
      console.log('[Init] initData length:', initData?.length);
      
      if (initData && initData.length > 0) {
        console.log('[Init] initData available!');
        return resolve(initData);
      }
      
      if (Date.now() - start > timeout) {
        console.log('[Init] initData timeout');
        return reject(new Error("initData not available"));
      }
      
      requestAnimationFrame(check);
    }
    
    check();
  });
}

async function callAuthApi(path: string, args: any): Promise<any> {
  const url = '/api/auth';
  console.log('[Boot] API call:', path);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error('[Boot] API timeout:', path);
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
      console.error('[Boot] API error:', path, response.status, errText);
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[Boot] API result:', path, !!data);
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error('[Boot] API exception:', path, err.message);
    throw err;
  }
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
    console.error('[Boot] URL parse error:', e);
    return null; 
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [appState, setAppState] = useState<AppState>('booting');
  const [env, setEnv] = useState<EnvState>('checking');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [player, setPlayer] = useState<any>(null);
  const bootRef = useRef(false);

  const doBootstrap = useCallback(async () => {
    if (bootRef.current) return;
    bootRef.current = true;
    
    console.log('[Boot] ====================');
    console.log('[Boot] Starting bootstrap');
    setAppState('booting');
    
    try {
      // Step 1: Check for existing valid token
      const stored = localStorage.getItem(TOKEN_KEY);
      if (stored) {
        console.log('[Boot] Found stored token, will validate via session query...');
        setToken(stored);
        // Token will be validated when we query the session
        // For now, try to get session data
        try {
          const sessionRes = await callAuthApi('/auth/getSessionUser', { token: stored });
          if (sessionRes?.user) {
            setUser(sessionRes.user);
            setPlayer(sessionRes.player);
            setEnv('telegram');
            setAppState('ready');
            console.log('[Boot] Token valid - ready');
            return;
          } else {
            console.log('[Boot] Session invalid, clearing token...');
            localStorage.removeItem(TOKEN_KEY);
          }
        } catch (e) {
          console.log('[Boot] Session query failed, clearing token...');
          localStorage.removeItem(TOKEN_KEY);
        }
      }
      
      // Step 2: Wait for Telegram SDK
      console.log('[Boot] Detecting environment...');
      setAppState('detecting');
      
      const tg = await waitForTelegramSDK(3000);
      
      if (!tg) {
        console.log('[Boot] No Telegram SDK - browser mode');
        setEnv('browser');
        setAppState('ready');
        return;
      }
      
      // Step 3: Verify we have initData
      console.log('[Boot] Telegram detected, waiting for initData...');
      setEnv('telegram');
      
      let initData: string | null = null;
      try {
        initData = await waitForInitData(tg, 2000);
      } catch (initErr: any) {
        console.error('[Boot] initData error:', initErr.message);
        
        // Try URL fallback
        initData = getInitDataFromUrl();
        if (!initData) {
          setError('Telegram session failed. Please reopen from Telegram bot.');
          setAppState('error');
          return;
        }
      }
      
      // Tell Telegram the app is ready
      tg.ready();
      tg.expand();
      
      console.log('[Boot] initData available, authenticating...');
      setAppState('authenticating');
      
      const authRes = await callAuthApi('/auth/telegramVerify', { initData });
      console.log('[Boot] Auth result:', authRes?.success);
      
      if (authRes.success && authRes.token) {
        localStorage.setItem(TOKEN_KEY, authRes.token);
        setToken(authRes.token);
        setUser(authRes.user);
        setPlayer(authRes.player);
        setAppState('ready');
        console.log('[Boot] Auth complete - ready');
      } else {
        console.error('[Boot] Auth failed:', authRes?.message);
        setError(authRes.message || 'Auth failed. Please reopen from Telegram bot.');
        setAppState('error');
      }
    } catch (err: any) {
      console.error('[Boot] Bootstrap error:', err.message);
      setError(err.message || 'Bootstrap failed');
      setAppState('error');
    }
  }, []);

  useEffect(() => {
    doBootstrap();
  }, [doBootstrap]);

  const logout = useCallback(() => {
    console.log('[Boot] Logout');
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
    setToken(null);
    setUser(null);
    setPlayer(null);
    bootRef.current = false;
    doBootstrap();
  }, [doBootstrap]);

  const retry = useCallback(() => {
    console.log('[Boot] Retry');
    bootRef.current = false;
    setError(null);
    doBootstrap();
  }, [doBootstrap]);

  const balance = {
    warBonds: player?.stats?.warBonds ?? 0,
    commandPoints: player?.stats?.commandPoints ?? 0,
  };

  return (
    <AppContext.Provider value={{ appState, env, error, user, player, token, logout, retry, balance }}>
      {children}
    </AppContext.Provider>
  );
}