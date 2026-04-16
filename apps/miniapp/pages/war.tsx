export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import Layout from '../src/components/Layout';

interface War {
  _id: any;
  attackerId: string;
  defenderId: string;
  attackerName: string;
  defenderName: string;
  status: string;
  startedAt: number;
  casualties: { attacker: number; defender: number };
}

function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', gap: '12px' }}>
      <div style={{
        width: '24px', height: '24px',
        border: '2px solid rgba(139,0,0,0.3)',
        borderTop: '2px solid #cc0000',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize: '9px', color: '#8892a4', letterSpacing: '3px' }}>SCANNING...</div>
    </div>
  );
}

export default function WarPage() {
  const { player, token, state } = useAuth();
  const [target, setTarget] = useState('');
  const [declaring, setDeclaring] = useState(false);
  const [msg, setMsg] = useState('');
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

  const apiRef = api as any;
  const activeWars = useQuery(
    (typeof window === 'undefined' ? 'skip' : state) === 'ready' && apiRef?.wars?.getActive 
      ? apiRef.wars.getActive 
      : 'skip'
  );
  const activeWarsArr = activeWars || [];
  const myWars = useQuery(
    (typeof window === 'undefined' ? 'skip' : state) === 'ready' && apiRef?.wars?.getForNation 
      ? apiRef.wars.getForNation
      : 'skip',
    player?.currentNation ? { nationIso: player.currentNation } : 'skip'
  );
  const myWarsArr = myWars || [];
  const declareWarMutation = useMutation(apiRef?.wars?.declareWar);

  const hasNation = !!player?.currentNation;
  const canDeclare = hasNation && (player?.role === 'PRESIDENT' || player?.role === 'MILITARY');

  const handleDeclareWar = async () => {
    if (state !== 'ready' || !target.trim() || !token || !player?.currentNation) return;
    if (!declareWarMutation) return;
    tg?.HapticFeedback?.impactOccurred('heavy');
    setDeclaring(true);
    setMsg('');
    try {
      await declareWarMutation({ 
        token: token, 
        attackerIso: player.currentNation, 
        defenderIso: target.trim() 
      });
      setMsg('⚔️ War declared!');
      tg?.HapticFeedback?.notificationOccurred('success');
      setTarget('');
    } catch (err: any) {
      setMsg(`❌ ${err.message || 'Failed'}`);
      tg?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setDeclaring(false);
    }
  };

  const wars = activeWarsArr;

  return (
    <Layout>
      <div style={{ padding: '12px', paddingBottom: '80px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '9px', color: '#8B0000', letterSpacing: '4px', marginBottom: '4px' }}>⚔️ GLOBAL THEATRE</div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFD700', letterSpacing: '2px' }}>WAR ROOM</div>
        </div>

        {canDeclare && (
          <div style={{
            background:    'linear-gradient(135deg, #1a0505, #0d1117)',
            border:        '1px solid rgba(204,0,0,0.5)',
            borderRadius:  '12px',
            padding:       '14px',
            marginBottom:  '14px',
            boxShadow:     '0 0 20px rgba(204,0,0,0.15)',
          }}>
            <div style={{ fontSize: '9px', color: '#cc0000', letterSpacing: '3px', marginBottom: '10px' }}>
              🎯 DECLARE WAR
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={target}
                onChange={e => setTarget(e.target.value)}
                placeholder="TARGET NATION ISO (e.g. US, CN)..."
                style={{
                  flex:          1,
                  padding:       '10px 12px',
                  background:    'rgba(0,0,0,0.5)',
                  border:        '1px solid rgba(139,0,0,0.4)',
                  borderRadius:  '6px',
                  color:         '#e8e8e8',
                  fontSize:      '11px',
                  letterSpacing: '1px',
                  outline:       'none',
                  fontFamily:    'monospace',
                }}
              />
              <button
                onClick={handleDeclareWar}
                disabled={declaring || !target.trim()}
                style={{
                  padding:       '10px 16px',
                  background:    declaring ? '#333' : 'linear-gradient(135deg, #cc0000, #8B0000)',
                  border:        'none',
                  borderRadius:  '6px',
                  color:         '#fff',
                  fontSize:      '10px',
                  letterSpacing: '1px',
                  fontWeight:    'bold',
                  cursor:        declaring ? 'not-allowed' : 'pointer',
                  boxShadow:     declaring ? 'none' : '0 0 12px rgba(204,0,0,0.4)',
                  whiteSpace:    'nowrap',
                }}
              >
                {declaring ? '...' : 'DECLARE'}
              </button>
            </div>
            {msg && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: msg.startsWith('❌') ? '#cc0000' : '#00ff88', letterSpacing: '1px' }}>
                {msg}
              </div>
            )}
          </div>
        )}

        <div style={{ fontSize: '9px', color: '#8892a4', letterSpacing: '3px', marginBottom: '10px' }}>
          ACTIVE CONFLICTS · {wars.length}
        </div>

        {activeWars === null ? <Spinner /> : wars.length === 0 ? (
          <div style={{
            textAlign:   'center',
            padding:     '40px 20px',
            color:       '#444',
            fontSize:    '13px',
            letterSpacing: '2px',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🕊️</div>
            <div style={{ color: '#8892a4' }}>WORLD IS AT PEACE</div>
            <div style={{ fontSize: '10px', color: '#444', marginTop: '6px' }}>No active conflicts</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {wars.map((war: War) => (
              <div key={war._id} style={{
                background:   'linear-gradient(135deg, #0d1117, #161b22)',
                border:       '1px solid rgba(139,0,0,0.4)',
                borderRadius: '12px',
                padding:      '14px',
                position:     'relative',
                overflow:     'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, #cc0000, transparent)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e8e8e8', letterSpacing: '1px' }}>
                      {war.attackerName} <span style={{ color: '#cc0000' }}>⚔️</span> {war.defenderName}
                    </div>
                    <div style={{ fontSize: '9px', color: '#8892a4', marginTop: '3px', letterSpacing: '1px' }}>
                      Started {war.startedAt ? new Date(war.startedAt).toLocaleDateString() : 'recently'} · {war.status?.toUpperCase()}
                    </div>
                  </div>
                  <div style={{
                    background:    'rgba(204,0,0,0.15)',
                    border:        '1px solid rgba(204,0,0,0.3)',
                    borderRadius:  '6px',
                    padding:       '4px 8px',
                    fontSize:      '11px',
                    color:         '#cc0000',
                    fontWeight:    'bold',
                    fontFamily:    'monospace',
                  }}>
                    ACTIVE
                  </div>
                </div>

                {war.casualties && (
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    <div style={{ fontSize: '9px', color: '#8892a4' }}>
                      ☠️ ATK: <span style={{ color: '#cc0000' }}>{war.casualties.attacker?.toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '9px', color: '#8892a4' }}>
                      ☠️ DEF: <span style={{ color: '#cc0000' }}>{war.casualties.defender?.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}