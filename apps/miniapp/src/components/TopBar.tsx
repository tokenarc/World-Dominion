'use client';

import { useApp, useBalance } from '../context/AppContext';
import { useRouter } from 'next/router';

export default function TopBar() {
  const router = useRouter();
  const { user, appState } = useApp();
  const { warBonds, commandPoints } = useBalance();
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  
  const firstName = user?.firstName?.[0]?.toUpperCase() || '?';
  const isReady = appState === 'ready';

  const handleHaptic = () => {
    tg?.HapticFeedback?.impactOccurred('light');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '52px',
      background: 'rgba(5, 8, 16, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(204, 0, 0, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      zIndex: 100,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ fontSize: '14px', color: '#cc0000', fontWeight: 900, fontFamily: 'Orbitron, sans-serif' }}>
          ◈ WD
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div 
          onClick={handleHaptic}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '12px' }}>💎</span>
          <span style={{ fontSize: '12px', color: '#FFD700', fontFamily: 'JetBrains Mono, monospace' }}>
            {warBonds.toLocaleString()}
          </span>
        </div>
        
        <div 
          onClick={handleHaptic}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '12px' }}>⚡</span>
          <span style={{ fontSize: '12px', color: '#00ff88', fontFamily: 'JetBrains Mono, monospace' }}>
            {commandPoints.toLocaleString()}
          </span>
        </div>

        <div
          onClick={() => { handleHaptic(); router.push('/profile'); }}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #cc0000, #8B0000)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#FFD700',
            cursor: 'pointer',
            boxShadow: '0 0 10px rgba(204, 0, 0, 0.4)',
          }}
        >
          {firstName}
        </div>
      </div>
    </div>
  );
}