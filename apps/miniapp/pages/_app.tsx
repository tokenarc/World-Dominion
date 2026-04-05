import type { AppProps } from 'next/app';
import { ConvexProvider } from 'convex/react';
import { ConvexReactClient } from 'convex/react';
import { AuthProvider } from '../src/context/AuthContext';
import { CONVEX_URL } from '../src/lib/convex';
import '../src/styles/global.css';
import '../src/index.css';

function createConvexClient() {
  if (!CONVEX_URL) {
    if (typeof window !== 'undefined') {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is not set. Please configure your Convex deployment URL.");
    }
    return null;
  }
  return new ConvexReactClient(CONVEX_URL);
}

export default function App({ Component, pageProps }: AppProps) {
  const convex = createConvexClient();

  if (!convex) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0a0f14',
        color: '#cc0000',
        fontFamily: 'monospace',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <h2>Configuration Error</h2>
          <p>NEXT_PUBLIC_CONVEX_URL environment variable is not set.</p>
          <p style={{ fontSize: '12px', color: '#8892a4' }}>This app requires a Convex backend.</p>
        </div>
      </div>
    );
  }

  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ConvexProvider>
  );
}