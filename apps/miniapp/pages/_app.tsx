'use client';

import { useState, useEffect, createContext, useContext, ReactNode, Component } from 'react';
import type { AppProps } from 'next/app';
import '../src/styles/global.css';
import '../src/index.css';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 
  'https://peaceful-scorpion-529.convex.cloud';

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

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#050810',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#cc0000',
          fontFamily: 'monospace',
          padding: '20px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ letterSpacing: '3px', marginBottom: '12px', fontSize: '14px', color: '#FFD700' }}>
            APPLICATION ERROR
          </h2>
          <pre style={{ fontSize: '10px', color: '#cc0000', marginBottom: '20px', maxWidth: '300px' }}>
            {this.state.error?.message || 'Unknown error'}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function LoadingScreen({ message = 'Initializing...' }: { message?: string }) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#050810',
      color: '#FFD700',
      fontFamily: 'monospace',
    }}>
      <div>
        <div style={{ fontSize: '20px', letterSpacing: '4px' }}>WORLD DOMINION</div>
        <div style={{ fontSize: '10px', color: '#667788', marginTop: '10px' }}>{message}</div>
      </div>
    </div>
  );
}

function DebugScreen({ info }: { info: any }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050810',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#cc0000',
      fontFamily: 'monospace',
      padding: '20px',
    }}>
      <div style={{ fontSize: '32px', marginBottom: '20px' }}>⚠️</div>
      <h2 style={{ letterSpacing: '3px', marginBottom: '12px', fontSize: '14px', color: '#FFD700' }}>
        DEBUG INFO
      </h2>
      <pre style={{ fontSize: '10px', color: '#00ff88', marginBottom: '20px', maxWidth: '300px', whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(info, null, 2)}
      </pre>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050810',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#cc0000',
      fontFamily: 'monospace',
      padding: '20px',
    }}>
      <div style={{ fontSize: '32px', marginBottom: '20px' }}>⚠️</div>
      <h2 style={{ letterSpacing: '3px', marginBottom: '12px', fontSize: '14px', color: '#FFD700' }}>
        APPLICATION ERROR
      </h2>
      <p style={{ fontSize: '12px', color: '#667788', maxWidth: '280px', textAlign: 'center' }}>
        {message}
      </p>
    </div>
  );
}

async function convexFetch(action: string, args: any): Promise<any> {
  const response = await fetch(`${CONVEX_URL}/api/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ args }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function AuthApp({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [player, setPlayer] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-web-app.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('wd_token');
    if (stored) {
      setToken(stored);
    }
    setState('authenticating');
  }, []);

  useEffect(() => {
    if (state !== 'authenticating') return;

    const tg = (window as any).Telegram?.WebApp;
    const initData = tg?.initData;
    
    setTimeout(() => {
      const tg2 = (window as any).Telegram?.WebApp;
      setDebugInfo({
        hasTelegram: !!tg2,
        hasWebApp: !!(tg2 as any)?.WebApp,
        initData: tg2?.initData ? (tg2.initData.substring(0, 50) + '...') : 'none',
        initDataLength: tg2?.initData?.length || 0,
        token: token ? 'present' : 'none',
      });
    }, 1000);

    if (!token && !initData) {
      setState('error');
      setError('Open through Telegram bot.');
      return;
    }

    if (token) {
      convexFetch('auth/getSessionUser', { token })
        .then((session) => {
          if (session === null) {
            try { localStorage.removeItem('wd_token'); } catch (e) {}
            setToken(null);
            setState('authenticating');
            return;
          }
          setUser(session.user);
          setPlayer(session.player);
          setState('ready');
        })
        .catch((err) => {
          setState('error');
          setError('Session check failed: ' + err.message);
        });
      return;
    }

    if (initData) {
      convexFetch('auth/telegramVerify', { initData })
        .then((result) => {
          if (result?.success && result?.token) {
            localStorage.setItem('wd_token', result.token);
            setToken(result.token);
            setUser(result.user);
            setPlayer(result.player);
            setState('ready');
          } else {
            setState('error');
            setError(result?.message || 'Auth failed. Try again.');
          }
        })
        .catch((err) => {
          setState('error');
          setError('Auth failed: ' + err.message);
        });
    }
  }, [state, token]);

  const logout = () => {
    try { localStorage.removeItem('wd_token'); } catch (e) {}
    setToken(null);
    setUser(null);
    setPlayer(null);
    setState('loading');
  };

  if (debugInfo && !token) {
    return <DebugScreen info={debugInfo} />;
  }

  if (state === 'loading') {
    return <LoadingScreen />;
  }

  if (state === 'authenticating') {
    return <LoadingScreen message="Connecting to Telegram..." />;
  }

  if (state === 'error') {
    return <ErrorScreen message={error || 'Auth failed'} />;
  }

  return (
    <AuthContext.Provider value={{ state, error, user, player, token, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function AppContent({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <AuthApp>
        <Component {...pageProps} />
      </AuthApp>
    </ErrorBoundary>
  );
}

export default function App(props: AppProps) {
  return <AppContent {...props} />;
}