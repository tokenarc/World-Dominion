'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useApp, useBalance } from '../context/AppContext';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

interface AppShellProps {
  children: ReactNode;
}

function LoadingScreen({ message = 'INITIALIZING...' }: { message?: string }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050810',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(139,0,0,0.3)',
        borderTop: '3px solid #cc0000',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontSize: '11px', color: '#8892a4', letterSpacing: '3px' }}>
        {message}
      </div>
    </div>
  );
}

function ErrorScreen({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050810',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      gap: '20px',
    }}>
      <div style={{ fontSize: '48px' }}>⚠️</div>
      <div style={{ fontSize: '14px', color: '#cc0000', textAlign: 'center', letterSpacing: '1px', maxWidth: '280px' }}>
        {error || 'Error'}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: 'linear-gradient(135deg, #8B0000, #cc0000)',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            letterSpacing: '1px',
          }}
        >
          RETRY
        </button>
      )}
    </div>
  );
}

function BrowserBanner() {
  return (
    <div style={{
      background: 'linear-gradient(90deg, #8B0000, #cc0000)',
      padding: '8px 16px',
      textAlign: 'center',
      fontSize: '10px',
      color: '#fff',
      letterSpacing: '1px',
      fontWeight: 'bold',
    }}>
      🔸 BROWSER MODE - Limited functionality
    </div>
  );
}

function DevModeScreen() {
  const { logout } = useApp();
  
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050810',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      gap: '20px',
    }}>
      <div style={{ fontSize: '48px' }}>🔧</div>
      <div style={{ fontSize: '14px', color: '#FFD700', textAlign: 'center', letterSpacing: '1px' }}>
        DEVELOPMENT MODE
      </div>
      <div style={{ fontSize: '11px', color: '#8892a4', textAlign: 'center', maxWidth: '260px', lineHeight: '1.6' }}>
        The app requires Telegram to function fully. 
        Open from the Telegram bot to authenticate.
      </div>
      <button
        onClick={logout}
        style={{
          background: 'transparent',
          border: '1px solid #cc0000',
          borderRadius: '8px',
          padding: '10px 20px',
          color: '#cc0000',
          fontSize: '11px',
          cursor: 'pointer',
        }}
      >
        RETRY AUTH
      </button>
    </div>
  );
}

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const { appState, env, error, retry } = useApp();
  const [pageKey, setPageKey] = useState(0);

  useEffect(() => {
    setPageKey(k => k + 1);
  }, [router.asPath]);

  if (appState === 'booting') {
    return <LoadingScreen message="BOOTING..." />;
  }

  if (appState === 'detecting') {
    return <LoadingScreen message="DETECTING ENVIRONMENT..." />;
  }

  if (appState === 'authenticating') {
    return <LoadingScreen message="AUTHENTICATING..." />;
  }

  if (appState === 'error') {
    return <ErrorScreen error={error} onRetry={retry} />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050810',
      paddingTop: '52px',
      paddingBottom: '60px',
    }}>
      {env === 'browser' && <BrowserBanner />}
      <TopBar />
      <BottomNav />
      <div key={pageKey}>
        {children}
      </div>
    </div>
  );
}