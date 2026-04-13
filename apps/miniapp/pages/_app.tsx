'use client';

import { useState, useEffect, createContext, useContext, ReactNode, Component } from 'react';
import type { AppProps } from 'next/app';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
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

function getInitDataFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash.substring(1));
  const initData = params.get('tgWebAppData');
  if (initData) {
    try {
      return decodeURIComponent(initData);
    } catch {
      return initData;
    }
  }
  return null;
}

function AuthContent({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const verifyMutation = useMutation(api.auth.telegramVerify as any);
  const sessionUser = useQuery(
    api.auth.getSessionUser as any, 
    token ? { token } : 'skip'
  );

  useEffect(() => {
    const stored = localStorage.getItem('wd_token');
    if (stored) {
      setToken(stored);
    }
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
      if (sessionUser === undefined) return;
      
      if (sessionUser === null) {
        try { localStorage.removeItem('wd_token'); } catch (e) {}
        setToken(null);
        return;
      }
      
      setState('ready');
      return;
    }

    if (urlInitData) {
      verifyMutation({ initData: urlInitData })
        .then((result: any) => {
          if (result?.success && result?.token) {
            localStorage.setItem('wd_token', result.token);
            setToken(result.token);
          } else {
            setState('error');
            setError(result?.message || 'Auth failed. Try again.');
          }
        })
        .catch((err: any) => {
          setState('error');
          setError('Auth failed: ' + (err?.message || 'Unknown error'));
        });
    }
  }, [state, token, sessionUser, verifyMutation]);

  const logout = () => {
    try { localStorage.removeItem('wd_token'); } catch (e) {}
    setToken(null);
    setState('loading');
  };

  if (state === 'authenticating' && !token) {
    return <LoadingScreen message="Authenticating..." />;
  }

  if (state === 'error') {
    return <ErrorScreen message={error || 'Auth failed'} />;
  }

  return (
    <AuthContext.Provider value={{ 
      state, 
      error, 
      user: sessionUser?.user || null, 
      player: sessionUser?.player || null, 
      token, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

function AuthApp({ children }: { children: ReactNode }) {
  const [convexClient, setConvexClient] = useState<ConvexReactClient | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const client = new ConvexReactClient(CONVEX_URL);
    setConvexClient(client);
  }, []);

  if (!mounted) {
    return <LoadingScreen />;
  }

  if (!convexClient) {
    return <LoadingScreen message="Connecting..." />;
  }

  return (
    <ConvexProvider client={convexClient}>
      <AuthContent>
        {children}
      </AuthContent>
    </ConvexProvider>
  );
}

function AppContent({ Component, pageProps }: AppProps) {
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