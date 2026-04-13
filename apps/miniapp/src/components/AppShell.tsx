'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import ProfileDrawer from './ProfileDrawer';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const { state } = useAuth();
  const [showDrawer, setShowDrawer] = useState(false);
  const [pageKey, setPageKey] = useState(0);

  useEffect(() => {
    setPageKey(k => k + 1);
  }, [router.asPath]);

  if (state !== 'ready') {
    return <>{children}</>;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050810',
      paddingTop: '52px',
      paddingBottom: '60px',
    }}>
      <TopBar onMenuClick={() => setShowDrawer(true)} />
      <BottomNav />
      <ProfileDrawer open={showDrawer} onClose={() => setShowDrawer(false)} />
      <div key={pageKey} style={{
        animation: 'fadeUp 0.3s ease-out',
      }}>
        {children}
      </div>
    </div>
  );
}