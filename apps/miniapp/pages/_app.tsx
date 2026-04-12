'use client';

import { useState, useEffect, createContext, useContext, ReactNode, Component } from 'react';
import type { AppProps } from 'next/app';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import '../src/styles/global.css';
import '../src/index.css';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 
  'https://peaceful-scorpion-529.convex.cloud';

type AuthState = 'loading' | 'ready' | 'error';

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
          <pre style={{ 
            fontSize: '10px', 
            color: '#cc0000', 
            marginBottom: '20px', 
            maxWidth: '300px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            textAlign: 'left',
            background: 'rgba(204,0,0,0.1)',
            padding: '12px',
            borderRadius: '4px',
          }}>
            {this.state.error?.message || 'Unknown error'}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function LoadingScreen() {
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
        <div style={{ fontSize: '10px', color: '#667788', marginTop: '10px' }}>Initializing...</div>
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
      <pre style={{ 
        fontSize: '10px', 
        color: '#cc0000', 
        marginBottom: '20px', 
        maxWidth: '300px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        textAlign: 'left',
        background: 'rgba(204,0,0,0.1)',
        padding: '12px',
        borderRadius: '4px',
      }}>
        {message}
      </pre>
    </div>
  );
}

function AppContent({ Component, pageProps }: AppProps) {
  const [client, setClient] = useState<ConvexReactClient | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const convexClient = new ConvexReactClient(CONVEX_URL);
      setClient(convexClient);
    } catch (err) {
      console.error('[App] Convex client init failed:', err);
    }
  }, []);

  if (!mounted) {
    return <LoadingScreen />;
  }

  if (!client) {
    return <ErrorScreen message="Failed to connect to server" />;
  }

  return (
    <ErrorBoundary>
      <ConvexProvider client={client}>
        <Component {...pageProps} />
      </ConvexProvider>
    </ErrorBoundary>
  );
}

export default function App(props: AppProps) {
  return <AppContent {...props} />;
}