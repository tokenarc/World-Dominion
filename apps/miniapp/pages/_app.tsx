'use client';

import { useState, useEffect, createContext, useContext, ReactNode, Component } from 'react';
import type { AppProps } from 'next/app';
import '../src/styles/global.css';
import '../src/index.css';

const CONVEX_URL = 'https://peaceful-scorpion-529.convex.site';

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
          <pre style={{fontSize: '10px', color: '#cc0000', maxWidth: '300px'}}>{this.state.error?.message || 'Unknown error'}</pre>
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

async function callConvex(action: string, args: any): Promise<any> {
  const url = `${CONVEX_URL}/api/${action}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ args }),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const text = await response.text();
  if (!text) {
    throw new Error('Empty response from server');
  }
  
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON: ' + text.substring(0, 100));
  }
}

function AuthApp({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

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
      callConvex('auth/getSessionUser', { token })
        .then((session) => {
          if (session === null) {
            try { localStorage.removeItem('wd_token'); } catch {}
            setToken(null);
            return;
          }
          setState('ready');
        })
        .catch((err: Error) => {
          setState('error');
          setError('Session check failed: ' + err.message);
        });
      return;
    }

    if (urlInitData) {
      callConvex('auth/telegramVerify', { initData: urlInitData })
        .then((result) => {
          if (result?.success && result?.token) {
            localStorage.setItem('wd_token', result.token);
            setToken(result.token);
            setState('ready');
          } else {
            setState('error');
            setError(result?.message || 'Auth failed');
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
    setState('loading');
  };

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