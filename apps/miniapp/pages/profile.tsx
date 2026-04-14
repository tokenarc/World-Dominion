export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../src/context/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import Layout from '../src/components/Layout';

function CountUp({ end, duration = 800, prefix = '', suffix = '' }: { end: number; duration?: number; prefix?: string; suffix?: string }) {
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

function StatBar({ label, value }: { label: string; value: number }) {
  const width = Math.min(100, Math.max(0, value));
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ fontSize: '9px', color: '#8892a4', letterSpacing: '1px' }}>{label}</span>
        <span style={{ fontSize: '9px', color: '#FFD700', fontFamily: 'monospace' }}>{value}/100</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${width}%`, background: 'linear-gradient(90deg, #cc0000, #FFD700)', borderRadius: '2px', transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, player, token, state } = useAuth();
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  
  const apiRef = api as any;
  const humanScoreData = state === 'ready' && token && apiRef?.players?.getHumanScore
    ? useQuery(apiRef.players.getHumanScore, { token })
    : undefined;
  
  const initials = user?.firstName?.[0]?.toUpperCase() || '?';
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Commander';
  const uid = player?.uid || 'WD-LOADING...';
  const username = user?.username ? `@${user.username}` : '—';
  const warBonds = player?.stats?.warBonds ?? 0;
  const cp = player?.stats?.commandPoints ?? 0;
  const rep = player?.stats?.reputation ?? 0;
  const humanScore = humanScoreData?.score ?? 0;
  const nation = player?.currentNation || player?.nationId || null;
  const role = player?.currentRole || player?.role || null;
  const joined = player?.joinedAt ? new Date(player.joinedAt).toLocaleDateString() : '—';
  const kyc = player?.kycVerified;
  
  const [showStats, setShowStats] = useState(false);
  
  useEffect(() => {
    tg?.ready();
  }, [tg]);
  
  const stats = player?.stats || {
    leadership: 0,
    strategicIq: 0,
    militaryIq: 0,
    diplomaticSkill: 0,
    economicAcumen: 0,
    intelligenceOps: 0,
    reputation: 0,
    loyalty: 0,
  };
  
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
      `}</style>
      <div style={{ padding: '12px', paddingBottom: '80px' }}>
        
        <div style={{
          background: 'linear-gradient(135deg, #0d1117, #1a0505)',
          border: '1px solid rgba(139,0,0,0.5)',
          borderRadius: '16px',
          padding: '20px',
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
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B0000, #cc0000)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#FFD700',
            border: '2px solid rgba(255,215,0,0.4)',
            boxShadow: '0 0 20px rgba(139,0,0,0.5)',
            flexShrink: 0,
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            {initials}
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#FFD700', letterSpacing: '2px', marginBottom: '4px', fontFamily: 'Orbitron, monospace' }}>{fullName.toUpperCase()}</div>
            <div style={{ fontSize: '10px', color: '#8892a4', letterSpacing: '1px', marginBottom: '4px' }}>{username}</div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(139,0,0,0.2)',
              border: '1px solid #cc0000',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '10px',
              color: '#cc0000',
              letterSpacing: '1px',
              fontFamily: 'monospace',
              marginBottom: '4px',
            }}>
              {uid}
            </div>
            <div style={{ fontSize: '9px', color: '#00ff88', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88' }} />
              ACTIVE COMMANDER
            </div>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <div style={{ background: '#0d1117', border: '1px solid rgba(139,0,0,0.2)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', marginBottom: '4px' }}>💎</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFD700', fontFamily: 'monospace' }}>
              <CountUp end={warBonds} />
            </div>
            <div style={{ fontSize: '8px', color: '#8892a4', letterSpacing: '1px', marginTop: '2px' }}>WAR BONDS</div>
          </div>
          <div style={{ background: '#0d1117', border: '1px solid rgba(139,0,0,0.2)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', marginBottom: '4px' }}>⚡</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00ff88', fontFamily: 'monospace' }}>
              <CountUp end={cp} />
            </div>
            <div style={{ fontSize: '8px', color: '#8892a4', letterSpacing: '1px', marginTop: '2px' }}>CMD PTS</div>
          </div>
          <div style={{ background: '#0d1117', border: '1px solid rgba(139,0,0,0.2)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', marginBottom: '4px' }}>⭐</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFD700', fontFamily: 'monospace' }}>
              {humanScore}/100
            </div>
            <div style={{ fontSize: '8px', color: '#8892a4', letterSpacing: '1px', marginTop: '2px' }}>SCORE</div>
          </div>
        </div>
        
        <div 
          onClick={() => { setShowStats(!showStats); tg?.HapticFeedback?.impactOccurred('light'); }}
          style={{ 
            background: '#0d1117', 
            border: '1px solid rgba(139,0,0,0.2)', 
            borderRadius: '12px', 
            padding: '14px', 
            marginBottom: '12px',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showStats ? '12px' : '0' }}>
            <div style={{ fontSize: '10px', color: '#cc0000', letterSpacing: '3px' }}>📊 COMMANDER PROFILE</div>
            <div style={{ fontSize: '12px', color: '#8892a4' }}>{showStats ? '▼' : '▶'}</div>
          </div>
          
          {showStats && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <StatBar label="LEADERSHIP" value={stats.leadership || 0} />
              <StatBar label="STRATEGIC IQ" value={stats.strategicIq || 0} />
              <StatBar label="MILITARY IQ" value={stats.militaryIq || 0} />
              <StatBar label="DIPLOMATIC" value={stats.diplomaticSkill || 0} />
              <StatBar label="ECONOMIC" value={stats.economicAcumen || 0} />
              <StatBar label="INTEL OPS" value={stats.intelligenceOps || 0} />
              <StatBar label="REPUTATION" value={stats.reputation || 0} />
              <StatBar label="LOYALTY" value={stats.loyalty || 0} />
            </div>
          )}
        </div>
        
        <div style={{ background: '#0d1117', border: '1px solid rgba(139,0,0,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', color: '#cc0000', letterSpacing: '3px', marginBottom: '10px' }}>CURRENT ASSIGNMENT</div>
          {nation ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🏳️</span>
                  <span style={{ fontSize: '14px', color: '#FFD700', fontWeight: 'bold' }}>{nation}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#cc0000', fontWeight: 'bold' }}>{role}</span>
                  <span style={{ fontSize: '8px', background: 'rgba(0,255,136,0.2)', color: '#00ff88', padding: '2px 6px', borderRadius: '4px', letterSpacing: '1px' }}>ACTIVE DUTY</span>
                </div>
              </div>
              <div 
                onClick={() => router.push('/nations')}
                style={{ fontSize: '10px', color: '#8892a4', cursor: 'pointer', textDecoration: 'underline' }}
              >
                VIEW MY NATION →
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{ fontSize: '11px', color: '#8892a4', marginBottom: '8px' }}>⚠️ NO ASSIGNMENT</div>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '12px' }}>You have not been assigned a role yet.</div>
              <div 
                onClick={() => router.push('/nations')}
                style={{ 
                  fontSize: '11px', 
                  color: '#cc0000', 
                  letterSpacing: '2px', 
                  animation: 'pulse 2s ease-in-out infinite', 
                  display: 'inline-block', 
                  padding: '10px 16px', 
                  border: '1px solid rgba(204,0,0,0.4)', 
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                BROWSE NATIONS & APPLY →
              </div>
            </div>
          )}
        </div>
        
        <div style={{ background: '#0d1117', border: '1px solid rgba(139,0,0,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', color: '#cc0000', letterSpacing: '3px', marginBottom: '10px' }}>📋 MY APPLICATIONS</div>
          <div style={{ fontSize: '11px', color: '#8892a4', textAlign: 'center', padding: '10px' }}>
            No applications submitted yet.
          </div>
          <div style={{ fontSize: '9px', color: '#666', textAlign: 'center' }}>Browse nations to apply for a role</div>
        </div>
        
        <div style={{ background: '#0d1117', border: '1px solid rgba(139,0,0,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', color: '#cc0000', letterSpacing: '3px', marginBottom: '10px' }}>COMMAND IDENTITY</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(139,0,0,0.1)' }}>
            <span style={{ fontSize: '10px', color: '#8892a4', letterSpacing: '2px' }}>JOINED</span>
            <span style={{ fontSize: '10px', color: '#e8e8e8', fontFamily: 'monospace' }}>{joined}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(139,0,0,0.1)' }}>
            <span style={{ fontSize: '10px', color: '#8892a4', letterSpacing: '2px' }}>TELEGRAM</span>
            <span style={{ fontSize: '10px', color: '#e8e8e8', fontFamily: 'monospace' }}>{username}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(139,0,0,0.1)' }}>
            <span style={{ fontSize: '10px', color: '#8892a4', letterSpacing: '2px' }}>AUTH</span>
            <span style={{ fontSize: '10px', color: '#00ff88', fontWeight: 'bold' }}>HMAC VERIFIED</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontSize: '10px', color: '#8892a4', letterSpacing: '2px' }}>KYC</span>
            <span style={{ fontSize: '10px', color: kyc ? '#00ff88' : '#FFD700', fontWeight: 'bold' }}>{kyc ? '✅ VERIFIED' : '⚠️ UNVERIFIED'}</span>
          </div>
        </div>
        
      </div>
    </Layout>
  );
}