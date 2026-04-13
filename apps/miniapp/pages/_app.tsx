'use client';

import { useState, useEffect, createContext, useContext, ReactNode, Component } from 'react';
import type { AppProps } from 'next/app';
import '../src/styles/global.css';
import '../src/index.css';

// Use the .cloud endpoint which is the main Convex URL
const CONVEX_URL = 'https://peaceful-scorpion-529.convex.cloud';

type AuthState = 'loading' | 'authenticating' | 'ready' | 'error';

interface AuthContextType {
  state: AuthState;
  error: string | null;
  user: any;
  player: any;
  token: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
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

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean; error: Error | null}> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{minHeight: '100vh', background: '#050810', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#cc0000', fontFamily: 'monospace', padding: '20px'}}>
          <div style={{fontSize: '32px', marginBottom: '20px'}}>⚠️</div>
          <h2 style={{letterSpacing: '3px', marginBottom: '12px', fontSize: '14px', color: '#FFD700'}}>APPLICATION ERROR</h2>
          <pre style={{fontSize: '10px', color: '#cc0000', maxWidth: '300px', whiteSpace: 'pre-wrap'}}>{this.state.error?.message || 'Unknown error'}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function LoadingScreen({ message }: { message?: string }) {
  return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050810', color: '#FFD700', fontFamily: 'monospace'}}>
      <div><div style={{fontSize: '20px', letterSpacing: '4px'}}>WORLD DOMINION</div><div style={{fontSize: '10px', color: '#667788', marginTop: '10px'}}>{message || 'Initializing...'}</div></div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div style={{minHeight: '100vh', background: '#050810', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#cc0000', fontFamily: 'monospace', padding: '20px'}}>
      <div style={{fontSize: '32px', marginBottom: '20px'}}>⚠️</div>
      <h2 style={{letterSpacing: '3px', marginBottom: '12px', fontSize: '14px', color: '#FFD700'}}>APPLICATION ERROR</h2>
      <p style={{fontSize: '12px', color: '#667788', maxWidth: '280px', textAlign: 'center'}}>{message}</p>
    </div>
  );
}

function DebugScreen({ info }: { info: any }) {
  return (
    <div style={{minHeight: '100vh', background: '#050810', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#FFD700', fontFamily: 'monospace', padding: '20px'}}>
      <h2 style={{letterSpacing: '3px', marginBottom: '12px', fontSize: '14px', color: '#FFD700'}}>DEBUG</h2>
      <pre style={{fontSize: '10px', color: '#00ff88', maxWidth: '300px', whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>{JSON.stringify(info, null, 2)}</pre>
    </div>
  );
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

async function callConvexDebug(path: string, body: any): Promise<any> {
  // Different URL format - try both
  const url1 = `https://peaceful-scorpion-529.convex.cloud${path}`;
  const url2 = `https://peaceful-scorpion-529.convex.site${path}`;
  
  const startTime = Date.now();
  
  for (const url of [url1, url2]) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const elapsed = Date.now() - startTime;
      const data = await response.json();
      
      return { success: true, url, status: response.status, elapsed, data };
    } catch (err: any) {
      console.log('Failed:', url, err.message);
      continue;
    }
  }
  
  return { 
    success: false, 
    error: 'Failed to fetch from both URLs',
    url1,
    url2,
    elapsed: Date.now() - startTime,
  };
}

function AuthApp({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>(null);

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
      callConvexDebug('/auth/getSessionUser', { args: { token } })
        .then((res) => {
          if (!res.success) {
            setState('error');
            setError('Network error: ' + res.error);
            setDebug(res);
            return;
          }
          if (res.data === null) {
            try { localStorage.removeItem('wd_token'); } catch {}
            setToken(null);
            return;
          }
          setState('ready');
        });
      return;
    }

    if (urlInitData) {
      callConvexDebug('/auth/telegramVerify', { args: { initData: urlInitData } })
        .then((res) => {
          setDebug(res);
          
          if (!res.success) {
            setState('error');
            setError('Network error: ' + res.error);
            return;
          }
          
          if (res.data?.success && res.data?.token) {
            try { localStorage.setItem('wd_token', res.data.token); } catch {}
            setToken(res.data.token);
            setState('ready');
          } else {
            setState('error');
            setError(res.data?.message || 'Auth failed');
          }
        });
    }
  }, [state, token]);

  const logout = () => {
    try { localStorage.removeItem('wd_token'); } catch {}
    setToken(null);
    setState('loading');
  };

  if (debug && !debug.success) {
    return <DebugScreen info={debug} />;
  }

  if (state === 'loading' || state === 'authenticating') {
    return <LoadingScreen message={state === 'authenticating' ? 'Authenticating...' : 'Loading...'} />;
  }

  if (state === 'error') {
    return <ErrorScreen message={error || 'Auth failed'} />;
  }

  return (
    <AuthContext.Provider value={{ state, error, user: null, player: null, token, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default function App(props: AppProps) {
  return (
    <ErrorBoundary>
      <AuthApp>
        <props.Component {...props.pageProps} />
      </AuthApp>
    </ErrorBoundary>
  );
}