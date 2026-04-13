export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '../src/context/AuthContext';
import Layout from '../src/components/Layout';

function CountUp({ end, duration = 500, prefix = '', suffix = '' }: { end: number; duration?: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const stepTime = Math.abs(duration / end);
    const timer = setInterval(() => {
      start += 1;
      if (start > end) {
        clearInterval(timer);
        return;
      }
      setCount(start);
    }, Math.max(stepTime, 1));
    return () => clearInterval(timer);
  }, [end, duration]);
  
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

export default function ProfilePage() {
  const { user, player, state } = useAuth();
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  
  const initials = user?.firstName?.[0]?.toUpperCase() || '?';
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Commander';
  const uid = user?.telegramId ? `WD-${String(user.telegramId).slice(-6).toUpperCase()}` : 'WD-??????';
  const username = user?.username ? `@${user.username}` : '—';
  const warBonds = player?.wallet?.warBonds ?? player?.stats?.warBonds ?? 0;
  const cp = player?.wallet?.commandPoints ?? player?.stats?.commandPoints ?? 0;
  const rep = player?.reputation ?? player?.stats?.reputation ?? 50;
  const nation = player?.currentNation || player?.nationId || null;
  const role = player?.currentRole || player?.role || null;
  const joined = player?.joinedAt ? new Date(player.joinedAt).toLocaleDateString() : '—';
  const kyc = player?.kycVerified;
  
  useEffect(() => {
    tg?.ready();
  }, [tg]);
  
  const Row = ({ label, value, color = '#e8e8e8' }: { label: string; value: React.ReactNode; color?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(139,0,0,0.1)' }}>
      <span style={{ fontSize: '10px', color: '#8892a4', letterSpacing: '2px' }}>{label}</span>
      <span style={{ fontSize: '11px', color, fontWeight: 'bold', letterSpacing: '1px', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
  
  return (
    <Layout>
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400px); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 10px rgba(255,215,0,0.4); }
          50% { box-shadow: 0 0 20px rgba(255,215,0,0.8); }
        }
        @keyframes countup {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{ padding: '12px', paddingBottom: '80px' }}>
        
        <div style={{
          background: 'linear-gradient(135deg, #0d1117, #1a0505)',
          border: '1px solid rgba(139,0,0,0.5)',
          borderRadius: '16px',
          padding: '24px 20px',
          marginBottom: '12px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, #cc0000, transparent)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#cc0000', opacity: 0.5, animation: 'scanline 3s linear infinite' }} />
          </div>
          
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B0000, #cc0000)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#FFD700',
            border: '2px solid rgba(255,215,0,0.4)',
            boxShadow: '0 0 20px rgba(139,0,0,0.5)',
            flexShrink: 0,
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            {initials}
          </div>
          
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#FFD700', letterSpacing: '2px', marginBottom: '4px', fontFamily: 'Orbitron, monospace' }}>{fullName.toUpperCase()}</div>
            <div style={{ fontSize: '10px', color: '#8892a4', letterSpacing: '1px', marginBottom: '3px' }}>{username}</div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(139,0,0,0.2)',
              border: '1px solid rgba(204,0,0,0.4)',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '9px',
              color: '#cc0000',
              letterSpacing: '1px',
              fontFamily: 'monospace',
            }}>
              {uid}
            </div>
            <div style={{ fontSize: '9px', color: '#00ff88', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88' }} />
              ACTIVE COMMANDER
            </div>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          {[
            { icon: '💎', label: 'WAR BONDS', value: warBonds, color: '#FFD700' },
            { icon: '⚡', label: 'CMD PTS', value: cp, color: '#00ff88' },
            { icon: '⭐', label: 'REPUTATION', value: `${rep}/100`, color: '#FFD700' },
          ].map((stat, i) => {
            const numVal = typeof stat.value === 'number' ? stat.value : parseInt(String(stat.value).replace(/[^0-9]/g, '')) || 0;
            return (
              <div key={i} style={{ background: '#0d1117', border: '1px solid rgba(139,0,0,0.2)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', marginBottom: '4px' }}>{stat.icon}</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: stat.color, fontFamily: 'monospace' }}>
                  <CountUp end={numVal} />
                </div>
                <div style={{ fontSize: '8px', color: '#8892a4', letterSpacing: '1px', marginTop: '2px' }}>{stat.label}</div>
              </div>
            );
          })}
        </div>
        
        <div style={{ background: '#0d1117', border: '1px solid rgba(139,0,0,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
          <div style={{ fontSize: '9px', color: '#8B0000', letterSpacing: '3px', marginBottom: '10px' }}>CURRENT ASSIGNMENT</div>
          {nation ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🏳️</span>
                <span style={{ fontSize: '14px', color: '#FFD700', fontWeight: 'bold' }}>{nation}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#cc0000', fontWeight: 'bold' }}>{role}</span>
                <span style={{ fontSize: '8px', background: 'rgba(204,0,0,0.3)', color: '#cc0000', padding: '2px 6px', borderRadius: '4px', letterSpacing: '1px' }}>SERVING</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{ fontSize: '11px', color: '#8892a4', marginBottom: '8px' }}>NO ASSIGNMENT</div>
              <div style={{ fontSize: '10px', color: '#cc0000', letterSpacing: '2px', animation: 'pulse 2s ease-in-out infinite', display: 'inline-block', padding: '6px 12px', border: '1px solid rgba(204,0,0,0.4)', borderRadius: '6px' }}>
                BROWSE NATIONS →
              </div>
            </div>
          )}
        </div>
        
        <div style={{ background: '#0d1117', border: '1px solid rgba(139,0,0,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
          <div style={{ fontSize: '9px', color: '#8B0000', letterSpacing: '3px', marginBottom: '10px' }}>COMMAND PROFILE</div>
          <Row label="JOINED" value={joined} />
          <Row label="TELEGRAM" value={username} />
          <Row label="AUTH" value="HMAC VERIFIED" color="#00ff88" />
          <Row label="KYC" value={kyc ? '✅ VERIFIED' : '⚠️ UNVERIFIED'} color={kyc ? '#00ff88' : '#FFD700'} />
        </div>
        
      </div>
    </Layout>
  );
}