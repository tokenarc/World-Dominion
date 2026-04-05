export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/client';
import Layout from '../src/components/Layout';

interface Nation {
  _id?: any;
  iso: string;
  name: string;
  flag: string;
  population: number;
  gdp: number;
  stability: number;
  atWarWith: string[];
  militaryLevel: number;
  economyLevel: number;
}

function Spinner() {
  return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', gap: '10px' }}><div style={{ width: '22px', height: '22px', border: '2px solid rgba(139,0,0,0.3)', borderTop: '2px solid #cc0000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><div style={{ fontSize: '9px', color: '#8892a4', letterSpacing: '3px' }}>SCANNING GLOBE...</div></div>;
}

export default function NationsPage() {
  const { authStage } = useAuth();
  const apiRef = api as any;
  
  const nations = useQuery(
    authStage === 'ready' && apiRef.nations?.getAll ? apiRef.nations.getAll : () => null,
    authStage === 'ready' && apiRef.nations?.getAll ? undefined : 'skip'
  );
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Nation | null>(null);
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

  const filtered = useMemo(() => {
    if (!nations || !Array.isArray(nations)) return [];
    const arr = nations as Nation[];
    return arr.filter((n: Nation) =>
      n.name?.toLowerCase().includes(search.toLowerCase()) ||
      n.iso?.toLowerCase().includes(search.toLowerCase())
    );
  }, [nations, search]);

  const fmt = (n?: number) => n ? (n >= 1e12 ? `$${(n/1e12).toFixed(1)}T` : n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : `$${(n/1e6).toFixed(0)}M`) : '—';

  if (selected) {
    const atWar = (selected.atWarWith?.length || 0) > 0;
    return (
      <Layout>
        <div style={{ padding: '12px', paddingBottom: '80px' }}>
          <button onClick={() => { setSelected(null); tg?.HapticFeedback?.impactOccurred('light'); }}
            style={{ background: 'none', border: 'none', color: '#8892a4', fontSize: '12px', cursor: 'pointer', letterSpacing: '2px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← BACK
          </button>

          <div style={{ background: 'linear-gradient(135deg, #0d1117, #1a0505)', border: '1px solid rgba(139,0,0,0.5)', borderRadius: '14px', padding: '20px', marginBottom: '12px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, #cc0000, transparent)' }} />
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>{selected.flag || '🌍'}</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#FFD700', letterSpacing: '2px', marginBottom: '4px' }}>{selected.name}</div>
            <div style={{ fontSize: '10px', color: '#8892a4', letterSpacing: '2px' }}>{selected.iso}</div>
            {atWar && <div style={{ marginTop: '8px', fontSize: '9px', color: '#cc0000', letterSpacing: '2px' }}>⚔️ AT WAR</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: 'GDP', value: fmt(selected.gdp), icon: '💵' },
              { label: 'MILITARY', value: `Lvl ${selected.militaryLevel}`, icon: '🪖' },
              { label: 'STABILITY', value: `${selected.stability}/100`, icon: '📊' },
              { label: 'ECONOMY', value: `Lvl ${selected.economyLevel}`, icon: '📈' },
              { label: 'POPULATION', value: (selected.population / 1e6).toFixed(1) + 'M', icon: '👥' },
              { label: 'AT WAR', value: atWar ? `${selected.atWarWith.length} wars` : 'PEACE', icon: atWar ? '⚔️' : '🕊️' },
            ].map(s => (
              <div key={s.label} style={{ background: '#0d1117', border: '1px solid rgba(139,0,0,0.2)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '18px', marginBottom: '6px' }}>{s.icon}</div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e8e8e8', fontFamily: 'monospace' }}>{s.value}</div>
                <div style={{ fontSize: '8px', color: '#8892a4', letterSpacing: '2px', marginTop: '3px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: '12px', paddingBottom: '80px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '9px', color: '#8B0000', letterSpacing: '4px', marginBottom: '4px' }}>🌍 INTELLIGENCE DATABASE</div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFD700', letterSpacing: '2px' }}>195 NATIONS</div>
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="SEARCH NATIONS..."
          style={{
            width: '100%', padding: '11px 14px', marginBottom: '14px',
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(139,0,0,0.4)',
            borderRadius: '8px', color: '#e8e8e8', fontSize: '11px',
            letterSpacing: '1px', outline: 'none', fontFamily: 'monospace',
            boxSizing: 'border-box',
          }}
        />

        {nations === null || nations === undefined || !filtered ? <Spinner /> : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#444', padding: '30px', fontSize: '10px', letterSpacing: '2px' }}>NO NATIONS FOUND</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '8px', color: '#8892a4', letterSpacing: '2px', marginBottom: '4px' }}>
              {filtered.length} NATIONS · TAP FOR INTEL
            </div>
            {filtered.map((n: Nation) => {
              const atWar = (n.atWarWith?.length || 0) > 0;
              return (
                <div key={n.iso}
                  onClick={() => { setSelected(n); tg?.HapticFeedback?.impactOccurred('light'); }}
                  style={{
                    display:       'flex',
                    alignItems:    'center',
                    gap:           '12px',
                    padding:       '11px 12px',
                    background:    'linear-gradient(135deg, #0d1117, #161b22)',
                    border:        `1px solid ${atWar ? 'rgba(204,0,0,0.4)' : 'rgba(139,0,0,0.2)'}`,
                    borderRadius:  '10px',
                    cursor:        'pointer',
                  }}
                >
                  <div style={{ fontSize: '24px', flexShrink: 0 }}>{n.flag || '🌍'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#e8e8e8', letterSpacing: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.name}</div>
                    <div style={{ fontSize: '9px', color: '#8892a4', marginTop: '2px' }}>
                      {n.iso}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {atWar && <div style={{ fontSize: '8px', color: '#cc0000', letterSpacing: '1px' }}>⚔️ AT WAR</div>}
                    <div style={{ fontSize: '9px', color: '#444', marginTop: '2px' }}>›</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}