import type { AppProps } from 'next/app';
import { ConvexProvider } from 'convex/react';
import { ConvexReactClient } from 'convex/react';
import { AuthProvider } from '../src/context/AuthContext';
import { CONVEX_URL } from '../src/lib/convex';
import '../src/styles/global.css';
import '../src/index.css';

const convex = new ConvexReactClient(CONVEX_URL);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ConvexProvider>
  );
}