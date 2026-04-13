import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth, useBalance } from '../src/context/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import Layout from '../src/components/Layout';

const DashboardContent = dynamic(() => Promise.resolve(Dashboard), { ssr: false });

export default DashboardContent;

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

function Dashboard() {
  const router  = useRouter();
  const { user, player, state } = useAuth();
  const { warBonds, commandPoints } = useBalance();
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  const isAuthenticated = state === 'ready';

  const events = typeof api?.events?.getRecent === 'function' ? useQuery(api.events.getRecent as any, { limit: 5 }) : undefined;
  const eventsArr = Array.isArray(events) ? events : [];
  const activeWars = typeof api?.wars?.getActive === 'function' ? useQuery(api.wars.getActive as any) : undefined;

  useEffect(() => {
    if (state === 'unauthenticated' || state === 'error') {
      router.replace('/');
    }
  }, [state, router]);

  useEffect(() => {
    tg?.BackButton?.hide();
  }, []);

  const firstName    = user?.firstName?.toUpperCase() || 'COMMANDER';
  const nationName   = player?.currentNation || 'UNASSIGNED';
  const roleName     = player?.currentRole   || player?.role || 'CIVILIAN';
  const humanScore   = player?.stats?.humanScore ?? player?.stats?.reputation ?? 0;
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
              <span style={{ fontSize: '8px', color: '#8892a4', letterSpacing: '2px' }}>HUMAN SCORE</span>
              <span style={{ fontSize: '8px', color: '#FFD700' }}>{humanScore}/100</span>
            </div>
            <div style={{ height: '3px', background: 'rgba(255,215,0,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height:     '100%',
                width:      `${humanScore}%`,
                background: 'linear-gradient(90deg, #8B0000, #FFD700)',
                borderRadius: '2px',
                transition: 'width 1s ease',
              }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <div style={{
            background:   'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
            border:       '1px solid #FFD70040',
            borderRadius: '10px',
            padding:      '12px',
            display:      'flex',
            alignItems:   'center',
            gap:          '10px',
            position:     'relative',
            overflow:     'hidden',
            boxShadow:    '0 0 12px #FFD70030',
          }}>
            <div style={{ fontSize: '22px' }}>💎</div>
            <div>
              <div style={{ fontSize: '8px', color: '#8892a4', letterSpacing: '2px', marginBottom: '2px' }}>WAR BONDS</div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFD700' }}>{warBonds.toLocaleString()}</div>
            </div>
          </div>
          <div style={{
            background:   'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
            border:       '1px solid #00ff8840',
            borderRadius: '10px',
            padding:      '12px',
            display:      'flex',
            alignItems:   'center',
            gap:          '10px',
            position:     'relative',
            overflow:     'hidden',
            boxShadow:    '0 0 12px #00ff8830',
          }}>
            <div style={{ fontSize: '22px' }}>⚡</div>
            <div>
              <div style={{ fontSize: '8px', color: '#8892a4', letterSpacing: '2px', marginBottom: '2px' }}>CMD POINTS</div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#00ff88' }}>{commandPoints.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <div style={{
            background:   'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
            border:       '1px solid #8892a440',
            borderRadius: '10px',
            padding:      '12px',
            display:      'flex',
            alignItems:   'center',
            gap:          '10px',
          }}>
            <div style={{ fontSize: '22px' }}>🌍</div>
            <div>
              <div style={{ fontSize: '8px', color: '#8892a4', letterSpacing: '2px', marginBottom: '2px' }}>NATION</div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#8892a4' }}>{nationName}</div>
            </div>
          </div>
          <div style={{
            background:   'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
            border:       '1px solid #cc000040',
            borderRadius: '10px',
            padding:      '12px',
            display:      'flex',
            alignItems:   'center',
            gap:          '10px',
          }}>
            <div style={{ fontSize: '22px' }}>🎖️</div>
            <div>
              <div style={{ fontSize: '8px', color: '#8892a4', letterSpacing: '2px', marginBottom: '2px' }}>ROLE</div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#cc0000' }}>{roleName}</div>
            </div>
          </div>
        </div>

        {!hasNation ? (
          <div
            onClick={() => {
              tg?.HapticFeedback?.impactOccurred('medium');
              router.push('/nations');
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

          {eventsArr.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#444', fontSize: '11px', letterSpacing: '2px' }}>
              SCANNING...
            </div>
          ) : eventsArr.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {eventsArr.map((e: any, i: number) => (
                <IntelItem
                  key={i}
                  text={e.title || e.description || 'Classified event'}
                  time={e.createdAt ? new Date(e.createdAt).toLocaleTimeString() : 'UNKNOWN'}
                  type={e.type === 'war_declared' ? 'war' : e.type === 'stability_change' ? 'economy' : 'intel'}
                />
              ))}
            </div>
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