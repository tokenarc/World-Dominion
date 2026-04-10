import type { AppProps } from 'next/app';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { AuthProvider } from '../src/context/AuthContext';
import '../src/styles/global.css';
import '../src/index.css';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 
  'https://peaceful-scorpion-529.convex.cloud';

const convexClient = new ConvexReactClient(CONVEX_URL);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ConvexProvider client={convexClient}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ConvexProvider>
  );
}