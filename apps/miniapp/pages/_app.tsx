'use client';

import Head from 'next/head';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../src/context/AuthContext';
import AppShell from '../src/components/AppShell';
import '../src/styles/global.css';
import '../src/index.css';

const fonts = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600&display=swap');
`;

export default function App(props: AppProps) {
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
      <AuthProvider>
        <AppShell>
          <props.Component {...props.pageProps} />
        </AppShell>
      </AuthProvider>
    </>
  );
}