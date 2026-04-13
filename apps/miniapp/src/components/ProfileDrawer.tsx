'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
}

type SubTab = 'profile' | 'achievements' | 'referrals' | 'settings';

export default function ProfileDrawer({ open, onClose }: ProfileDrawerProps) {
  const router = useRouter();
  const { user, player, logout, token } = useAuth();
  const [subTab, setSubTab] = useState<SubTab>('profile');
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

  const firstName = user?.firstName || 'Commander';
  const warBonds = player?.wallet?.warBonds ?? player?.stats?.warBonds ?? 0;
  const cp = player?.wallet?.commandPoints ?? player?.stats?.commandPoints ?? 0;
  const reputation = player?.reputation ?? player?.stats?.reputation ?? 50;
  const nation = player?.currentNation || '—';
  const role = player?.currentRole || 'Civilian';

  const handleLogout = () => {
    tg?.HapticFeedback?.impactOccurred('heavy');
    logout();
    router.replace('/');
  };

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 150,
        }}
      />
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(180deg, #0d1117 0%, #050810 100%)',
        borderBottom: '1px solid rgba(204, 0, 0, 0.3)',
        padding: '16px',
        zIndex: 200,
        animation: 'slideDown 0.3s ease-out',
        maxHeight: '70vh',
        overflow: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '14px', color: '#cc0000', fontFamily: 'Orbitron, sans-serif', letterSpacing: '2px' }}>
            ◈ COMMANDER PROFILE
          </span>
          <div
            onClick={onClose}
            style={{ fontSize: '20px', color: '#8892a4', cursor: 'pointer' }}
          >
            ✕
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #cc0000, #8B0000)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#FFD700',
            border: '2px solid rgba(255, 215, 0, 0.4)',
            boxShadow: '0 0 20px rgba(204, 0, 0, 0.5)',
          }}>
            {firstName[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 900, color: '#FFD700', fontFamily: 'Orbitron, sans-serif' }}>
            {firstName.toUpperCase()}
          </div>
          <div style={{ fontSize: '11px', color: '#8892a4' }}>
            @{user?.username || '—'} · {nation}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '8px' }}>
          {(['profile', 'achievements', 'referrals', 'settings'] as SubTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              style={{
                flex: 1,
                padding: '8px',
                background: subTab === tab ? 'linear-gradient(135deg, #8B0000, #cc0000)' : 'none',
                border: 'none',
                borderRadius: '6px',
                color: subTab === tab ? '#fff' : '#8892a4',
                fontSize: '8px',
                letterSpacing: '1px',
                fontWeight: 'bold',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {subTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '8px', color: '#8892a4', letterSpacing: '2px', marginBottom: '6px' }}>REPUTATION</div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${reputation}%`, background: 'linear-gradient(90deg, #8B0000, #FFD700)', transition: 'width 0.8s ease' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: '#0d1117', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#FFD700', fontFamily: 'JetBrains Mono, monospace' }}>{warBonds}</div>
                <div style={{ fontSize: '8px', color: '#8892a4' }}>WAR BONDS</div>
              </div>
              <div style={{ background: '#0d1117', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#00ff88', fontFamily: 'JetBrains Mono, monospace' }}>{cp}</div>
                <div style={{ fontSize: '8px', color: '#8892a4' }}>CMD POINTS</div>
              </div>
            </div>
            <div style={{ background: '#0d1117', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', color: '#8892a4' }}>NATION</span>
                <span style={{ fontSize: '10px', color: '#FFD700' }}>{nation}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '10px', color: '#8892a4' }}>ROLE</span>
                <span style={{ fontSize: '10px', color: '#cc0000' }}>{role}</span>
              </div>
            </div>
          </div>
        )}

        {subTab === 'achievements' && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#8892a4', fontSize: '11px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
            <div>ACHIEVEMENTS LOCKED</div>
            <div style={{ fontSize: '9px', color: '#444', marginTop: '4px' }}>Complete missions to unlock</div>
          </div>
        )}

        {subTab === 'referrals' && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#8892a4', fontSize: '11px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📎</div>
            <div>NO REFERRALS YET</div>
          </div>
        )}

        {subTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#0d1117', borderRadius: '8px' }}>
              <span style={{ fontSize: '10px', color: '#8892a4' }}>NOTIFICATIONS</span>
              <div style={{ width: '36px', height: '20px', background: '#333', borderRadius: '10px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '2px', left: '2px', width: '16px', height: '16px', background: '#8892a4', borderRadius: '50%' }} />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            marginTop: '20px',
            padding: '14px',
            background: 'linear-gradient(135deg, #1a0505, #0d1117)',
            border: '1px solid rgba(204, 0, 0, 0.4)',
            borderRadius: '8px',
            color: '#cc0000',
            fontSize: '11px',
            letterSpacing: '2px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          ⏹ LOGOUT
        </button>
      </div>
    </>
  );
}