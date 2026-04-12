'use client';

import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { AuthProvider } from '../src/context/AuthContext';
import '../src/styles/global.css';
import '../src/index.css';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 
  'https://peaceful-scorpion-529.convex.cloud';

function AppContent({ Component, pageProps }: AppProps) {
  const [convexClient, setConvexClient] = useState<ConvexReactClient | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const client = new ConvexReactClient(CONVEX_URL);
    setConvexClient(client);
  }, []);

  if (!mounted || !convexClient) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0a0f14',
        color: '#FFD700',
        fontFamily: 'monospace',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', letterSpacing: '4px' }}>WORLD DOMINION</div>
          <div style={{ fontSize: '10px', color: '#8892a4', marginTop: '10px' }}>Initializing...</div>
        </div>
      </div>
    );
  }

  return (
    <ConvexProvider client={convexClient}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ConvexProvider>
  );
}

export default function App(props: AppProps) {
  return <AppContent {...props} />;
}