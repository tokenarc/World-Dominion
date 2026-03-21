import React from 'react';
import Header from './Header';
import Navigation from './Navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050810',
      backgroundImage: `
        radial-gradient(circle at 20% 50%, rgba(139,0,0,0.05) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255,215,0,0.03) 0%, transparent 50%)
      `
    }}>
      <Header />
      <main style={{ paddingTop: '0', paddingBottom: '70px' }}>
        {children}
      </main>
      <Navigation />
    </div>
  );
}
