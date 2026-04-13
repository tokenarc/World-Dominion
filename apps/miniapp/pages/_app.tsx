import React from 'react';
import Head from 'next/head';
import type { AppProps } from 'next/app';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { AuthProvider } from '../src/context/AuthContext';
import AppShell from '../src/components/AppShell';
import '../src/styles/global.css';
import '../src/index.css';

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  'https://peaceful-scorpion-529.convex.cloud'
);

const fonts = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600&display=swap');
`;

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  state = { hasError: false, error: '' };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
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
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>
            ⚠️
          </div>
          <div style={{
            fontSize: '12px',
            letterSpacing: '3px',
            marginBottom: '12px',
          }}>
            SYSTEM ERROR
          </div>
          <div style={{
            fontSize: '10px',
            color: '#667788',
            marginBottom: '24px',
            maxWidth: '280px',
          }}>
            {this.state.error}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #cc0000, #8B0000)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              letterSpacing: '2px',
              fontSize: '11px',
            }}
          >
            RESTART
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>World Dominion</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#050810" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <style>{fonts}</style>
      </Head>
      <ErrorBoundary>
        <ConvexProvider client={convex}>
          <AuthProvider>
            <AppShell>
              <Component {...pageProps} />
            </AppShell>
          </AuthProvider>
        </ConvexProvider>
      </ErrorBoundary>
    </>
  );
}