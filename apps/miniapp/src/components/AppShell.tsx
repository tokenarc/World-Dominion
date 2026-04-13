'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

interface AppShellProps {
  children: ReactNode;
}

function LoadingScreen() {
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
        INITIALIZING...
      </div>
    </div>
  );
}

function ErrorScreen({ error }: { error: string }) {
  const router = useRouter();
  
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050810',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      gap: '16px',
    }}>
      <div style={{ fontSize: '48px' }}>⚠️</div>
      <div style={{ fontSize: '14px', color: '#cc0000', textAlign: 'center', letterSpacing: '1px' }}>
        {error || 'Auth error'}
      </div>
      <div style={{ fontSize: '10px', color: '#8892a4', textAlign: 'center' }}>
        Please reopen from Telegram bot
      </div>
    </div>
  );
}

function UnauthenticatedScreen() {
  const router = useRouter();
  
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050810',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      gap: '16px',
    }}>
      <div style={{ fontSize: '48px' }}>🔒</div>
      <div style={{ fontSize: '14px', color: '#8892a4', textAlign: 'center', letterSpacing: '1px' }}>
        Please open through Telegram
      </div>
    </div>
  );
}

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const { state, error } = useAuth();
  const [pageKey, setPageKey] = useState(0);

  useEffect(() => {
    setPageKey(k => k + 1);
  }, [router.asPath]);

  if (state === 'initializing' || state === 'authenticating') {
    return <LoadingScreen />;
  }

  if (state === 'error') {
    return <ErrorScreen error={error} />;
  }

  if (state === 'unauthenticated') {
    return <UnauthenticatedScreen />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050810',
      paddingTop: '52px',
      paddingBottom: '60px',
    }}>
      <TopBar />
      <BottomNav />
      <div key={pageKey} style={{
        animation: 'fadeUp 0.3s ease-out',
      }}>
        {children}
      </div>
    </div>
  );
}