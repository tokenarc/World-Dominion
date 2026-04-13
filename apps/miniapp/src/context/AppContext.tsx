import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';

type AppState = 'booting' | 'detecting' | 'authenticating' | 'ready' | 'error';
type EnvState = 'checking' | 'telegram' | 'browser';

interface TelegramResult {
  type: 'telegram' | 'browser';
  tg: any;
}

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

const AUTH_TIMEOUT_MS = 8000;

async function detectTelegramReliable(timeout = 3000): Promise<TelegramResult> {
  return new Promise((resolve) => {
    const start = Date.now();

    function check() {
      const tg = (window as any).Telegram?.WebApp;
      
      console.log('[Env] TG OBJECT:', !!tg);
      console.log('[Env] WEBAPP:', !!tg);
      console.log('[Env] INIT DATA:', !!tg?.initData);
      console.log('[Env] INIT DATA UNSAFE:', !!tg?.initDataUnsafe);
      console.log('[Env] PLATFORM:', tg?.platform);
      console.log('[Env] VERSION:', tg?.version);

      const hasWebApp = !!tg;
      const hasInitData = !!tg?.initData && tg.initData.length > 0;
      const hasInitDataUnsafe = !!tg?.initDataUnsafe && tg.initDataUnsafe.length > 0;
      const hasPlatform = !!tg?.platform;
      const hasVersion = !!tg?.version;

      if (hasWebApp && (hasInitData || hasInitDataUnsafe || hasPlatform || hasVersion)) {
        console.log('[Env] Telegram detected!');
        return resolve({ type: 'telegram', tg });
      }

      if (Date.now() - start > timeout) {
        console.log('[Env] Telegram timeout - browser mode');
        return resolve({ type: 'browser', tg: null });
      }

      requestAnimationFrame(check);
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
      console.log('[Boot] Detecting environment...');
      setAppState('detecting');
      const result = await detectTelegramReliable(3000);
      
      if (result.type === 'telegram') {
        console.log('[Boot] Telegram detected, waiting for initData...');
        setEnv('telegram');
        
        try {
          const initData = await waitForInitData(result.tg, 2000);
          console.log('[Boot] initData available, authenticating...');
          
          setAppState('authenticating');
          const authRes = await callAuthApi('/auth/telegramVerify', { initData });
          console.log('[Boot] Auth result:', authRes?.success);
          
          if (authRes.success && authRes.token) {
            localStorage.setItem('wd_token', authRes.token);
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
        } catch (initErr: any) {
          console.error('[Boot] initData error:', initErr.message);
          setError('Telegram session failed. Please reopen from Telegram bot.');
          setAppState('error');
        }
      } else {
        console.log('[Boot] Browser mode');
        setEnv('browser');
        setAppState('ready');
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
    try { localStorage.removeItem('wd_token'); } catch {}
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