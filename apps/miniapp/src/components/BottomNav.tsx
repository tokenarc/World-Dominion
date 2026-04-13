'use client';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const TABS = [
  { icon: '🏠', label: 'HOME', path: '/dashboard' },
  { icon: '🌍', label: 'NATIONS', path: '/nations' },
  { icon: '⚔️', label: 'WAR', path: '/war' },
  { icon: '📈', label: 'MARKET', path: '/market' },
  { icon: '👤', label: 'PROFILE', path: '/profile' },
];

export default function BottomNav() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('/dashboard');
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

  useEffect(() => {
    setActiveTab(router.asPath);
  }, [router.asPath]);

  const handleTabClick = (path: string) => {
    tg?.HapticFeedback?.impactOccurred('light');
    router.push(path);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '60px',
      background: 'rgba(5, 8, 16, 0.98)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(204, 0, 0, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 100,
    }}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.path || (tab.path === '/dashboard' && activeTab === '/');
        return (
          <div
            key={tab.path}
            onClick={() => handleTabClick(tab.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              padding: '8px 12px',
              cursor: 'pointer',
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.15s ease',
            }}
          >
            {isActive && (
              <div style={{
                position: 'absolute',
                top: 0,
                width: '20px',
                height: '2px',
                background: '#cc0000',
                borderRadius: '1px',
              }} />
            )}
            <span style={{ fontSize: '22px', opacity: isActive ? 1 : 0.5 }}>{tab.icon}</span>
            <span style={{
              fontSize: '8px',
              color: isActive ? '#cc0000' : '#444',
              fontWeight: isActive ? 'bold' : 'normal',
              letterSpacing: '1px',
              fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase',
            }}>
              {tab.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}