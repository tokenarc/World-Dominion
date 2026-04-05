export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../src/context/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/client';
import Layout from '../src/components/Layout';

function StatCard({ icon, label, value, color = '#FFD700', glow = false }: { icon: string; label: string; value: string; color?: string; glow?: boolean }) {
  return (
    <div style={{
      background:   'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
      border:       `1px solid ${color}40`,
      borderRadius: '10px',
      padding:      '12px',
      display:      'flex',
      alignItems:   'center',
      gap:          '10px',
      position:     'relative',
      overflow:     'hidden',
      boxShadow:    glow ? `0 0 12px ${color}30` : 'none',
    }}>
      <div style={{
        position:   'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`
      }} />
      <div style={{ fontSize: '22px' }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '8px', color: '#8892a4', letterSpacing: '2px', marginBottom: '2px' }}>
          {label}
        </div>
        <div style={{
          fontSize:     '13px',
          fontWeight:   'bold',
          color,
          whiteSpace:   'nowrap',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
        }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, color, onClick }: { icon: string; label: string; color: string; onClick: () => void }) {
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  return (
    <button
      onClick={() => {
        tg?.HapticFeedback?.impactOccurred('light');
        onClick();
      }}
      style={{
        background:    'linear-gradient(135deg, #0d1117, #161b22)',
        border:        `1px solid ${color}`,
        borderRadius:  '10px',
        padding:       '14px 8px',
        color,
        fontSize:      '9px',
        letterSpacing: '1.5px',
        fontWeight:    'bold',
        cursor:        'pointer',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           '6px',
        boxShadow:     `0 0 10px ${color}20`,
        transition:    'all 0.15s',
        width:         '100%',
      }}
      onTouchStart={e => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)';
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${color}50`;
      }}
      onTouchEnd={e => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 10px ${color}20`;
      }}
    >
      <span style={{ fontSize: '24px' }}>{icon}</span>
      {label}
    </button>
  );
}

function IntelItem({ text, time, type }: { text: string; time: string; type: 'war' | 'intel' | 'economy' }) {
  const colors = { war: '#cc0000', intel: '#FFD700', economy: '#00ff88' };
  const icons  = { war: '⚔️', intel: '📡', economy: '📈' };
  return (
    <div style={{
      padding:      '10px 14px',
      borderBottom: '1px solid rgba(139,0,0,0.15)',
      display:      'flex',
      gap:          '10px',
      alignItems:   'flex-start',
    }}>
      <span style={{ fontSize: '14px', marginTop: '1px' }}>{icons[type]}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '11px', color: '#c8ccd4', lineHeight: '1.5' }}>{text}</div>
        <div style={{ fontSize: '9px', color: '#8892a4', marginTop: '3px', letterSpacing: '1px' }}>{time}</div>
      </div>
      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: colors[type], marginTop: '5px', flexShrink: 0, boxShadow: `0 0 4px ${colors[type]}` }} />
    </div>
  );
}

export default function Dashboard() {
  const router  = useRouter();
  const { user, player, sessionToken, isAuthenticated, authStage } = useAuth();
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

  const events = (authStage === 'ready' && isAuthenticated && typeof api?.events?.getRecent === 'function') ? useQuery(api.events.getRecent, { limit: 5 }) as any : null;
  const activeWars = (authStage === 'ready' && isAuthenticated && typeof api?.wars?.getActive === 'function') ? useQuery(api.wars.getActive) as any : null;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    tg?.BackButton?.hide();
  }, []);

  const firstName    = user?.firstName?.toUpperCase() || 'COMMANDER';
  const nationName   = player?.currentNation || 'UNASSIGNED';
  const roleName     = player?.currentRole   || player?.role || 'CIVILIAN';
  const warBonds     = player?.wallet?.warBonds     ?? player?.stats?.warBonds     ?? 0;
  const commandPoints = player?.wallet?.commandPoints ?? player?.stats?.commandPoints ?? 0;
  const reputation   = player?.reputation ?? player?.stats?.reputation ?? 50;
  const hasNation    = !!player?.currentNation;

  if (!isAuthenticated) return null;

  return (
    <Layout>
      <div style={{ padding: '12px', paddingBottom: '80px' }}>
        <div style={{
          background:    'linear-gradient(135deg, #0d1117 0%, #1a0505 100%)',
          border:        '1px solid rgba(139,0,0,0.6)',
          borderRadius:  '14px',
          padding:       '16px',
          marginBottom:  '12px',
          position:      'relative',
          overflow:      'hidden',
          boxShadow:     '0 0 30px rgba(139,0,0,0.15)',
        }}>
          <div style={{
            position:   'absolute', inset: 0,
            background: 'radial-gradient(circle at 85% 50%, rgba(139,0,0,0.2) 0%, transparent 60%)',
          }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '9px', color: '#8B0000', letterSpacing: '3px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />
              ACTIVE COMMANDER
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#FFD700', letterSpacing: '2px', marginBottom: '4px' }}>
              {firstName}
            </div>
            <div style={{ fontSize: '11px', color: '#8892a4', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: hasNation ? '#cc0000' : '#444' }}>
                {hasNation ? `🌍 ${nationName}` : '🌍 No Nation'}
              </span>
              <span style={{ color: '#333' }}>•</span>
              <span style={{ color: hasNation ? '#FFD700' : '#444' }}>
                {hasNation ? `🎖️ ${roleName}` : '🎖️ No Role'}
              </span>
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '8px', color: '#8892a4', letterSpacing: '2px' }}>REPUTATION</span>
              <span style={{ fontSize: '8px', color: '#FFD700' }}>{reputation}/100</span>
            </div>
            <div style={{ height: '3px', background: 'rgba(255,215,0,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height:     '100%',
                width:      `${reputation}%`,
                background: 'linear-gradient(90deg, #8B0000, #FFD700)',
                borderRadius: '2px',
                transition: 'width 1s ease',
              }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <StatCard icon="💎" label="WAR BONDS" value={warBonds.toLocaleString()} color="#FFD700" glow />
          <StatCard icon="⚡" label="CMD POINTS" value={commandPoints.toLocaleString()} color="#00ff88" glow />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <StatCard icon="🌍" label="NATION" value={nationName} color="#8892a4" />
          <StatCard icon="🎖️" label="ROLE" value={roleName} color="#cc0000" />
        </div>

        {!hasNation ? (
          <div
            onClick={() => {
              tg?.HapticFeedback?.impactOccurred('medium');
              router.push('/apply');
            }}
            style={{
              background:    'linear-gradient(135deg, #1a0505, #0d1117)',
              border:        '2px solid #cc0000',
              borderRadius:  '14px',
              padding:       '18px',
              marginBottom:  '12px',
              cursor:        'pointer',
              boxShadow:     '0 0 25px rgba(204,0,0,0.3)',
              display:       'flex',
              alignItems:    'center',
              justifyContent: 'space-between',
              position:      'relative',
              overflow:      'hidden',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50%, rgba(204,0,0,0.08), transparent 70%)' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: '9px', color: '#cc0000', letterSpacing: '3px', marginBottom: '4px' }}>🚀 BEGIN CONQUEST</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#FFD700' }}>Claim your nation</div>
              <div style={{ fontSize: '10px', color: '#8892a4', marginTop: '2px' }}>195 nations available</div>
            </div>
            <div style={{ fontSize: '28px', position: 'relative' }}>🌍</div>
          </div>
        ) : (
          <div
            onClick={() => {
              tg?.HapticFeedback?.impactOccurred('medium');
              router.push('/war');
            }}
            style={{
              background:    'linear-gradient(135deg, #1a0505, #0d1117)',
              border:        '2px solid #cc0000',
              borderRadius:  '14px',
              padding:       '18px',
              marginBottom:  '12px',
              cursor:        'pointer',
              boxShadow:     '0 0 25px rgba(204,0,0,0.3)',
              display:       'flex',
              alignItems:    'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '9px', color: '#cc0000', letterSpacing: '3px', marginBottom: '4px' }}>⚔️ WAR ROOM</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#FFD700' }}>Deploy your forces</div>
              <div style={{ fontSize: '10px', color: '#8892a4', marginTop: '2px' }}>Active conflicts: {activeWars?.length || 0}</div>
            </div>
            <div style={{ fontSize: '28px' }}>⚔️</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
          <ActionBtn icon="🌍" label="NATIONS"   color="#8B0000"  onClick={() => router.push('/nations')} />
          <ActionBtn icon="🎯" label="MISSIONS"  color="#FFD700"  onClick={() => router.push('/missions')} />
          <ActionBtn icon="📈" label="MARKET"    color="#00ff88"  onClick={() => router.push('/market')} />
          <ActionBtn icon="💰" label="VAULT"     color="#8892a4"  onClick={() => router.push('/wallet')} />
        </div>

        <div style={{
          background:    '#0d1117',
          border:        '1px solid rgba(139,0,0,0.4)',
          borderRadius:  '12px',
          overflow:      'hidden',
        }}>
          <div style={{
            padding:      '10px 14px',
            borderBottom: '1px solid rgba(139,0,0,0.3)',
            display:      'flex',
            alignItems:   'center',
            gap:          '8px',
          }}>
            <span style={{ fontSize: '11px', color: '#8B0000' }}>📡</span>
            <span style={{ fontSize: '10px', letterSpacing: '3px', color: '#FFD700', fontWeight: 'bold' }}>
              INTEL FEED
            </span>
            <div style={{
              marginLeft:   'auto',
              width:        '6px', height: '6px',
              borderRadius: '50%',
              background:   '#00ff88',
              boxShadow:    '0 0 6px #00ff88',
            }} />
          </div>

          {events === undefined ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#444', fontSize: '11px', letterSpacing: '2px' }}>
              SCANNING...
            </div>
          ) : events.length > 0 ? (
            events.map((e: any, i: number) => (
              <IntelItem
                key={i}
                text={e.title || e.description || 'Classified event'}
                time={e.createdAt ? new Date(e.createdAt).toLocaleTimeString() : 'UNKNOWN'}
                type={e.type === 'war_declared' ? 'war' : e.type === 'stability_change' ? 'economy' : 'intel'}
              />
            ))
          ) : (
            <div style={{ padding: '16px 14px' }}>
              <div style={{ fontSize: '9px', color: '#8B0000', letterSpacing: '2px', marginBottom: '6px' }}>
                CLASSIFIED — EYES ONLY
              </div>
              <div style={{ fontSize: '12px', color: '#8892a4', lineHeight: '1.6' }}>
                Welcome to World Dominion. 195 nations await your command.
                {!hasNation && ' Apply for a role to begin your conquest.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}