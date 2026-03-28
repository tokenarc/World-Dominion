import { useState, useEffect, useMemo } from 'react';
import Layout from '../src/components/Layout';

interface Nation {
  id: string; name: string; flag?: string; capital?: string;
  continent?: string; gdp?: number; militaryStrength?: number;
  stability?: number; playerCount?: number; ideology?: string;
  atWarWith?: string[]; occupiedBy?: string | null;
}

function Spinner() {
  return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', gap: '10px' }}><div style={{ width: '22px', height: '22px', border: '2px solid rgba(139,0,0,0.3)', borderTop: '2px solid #cc0000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><div style={{ fontSize: '9px', color: '#8892a4', letterSpacing: '3px' }}>SCANNING GLOBE...</div></div>;
}

export default function NationsPage() {
  const [nations, setNations] = useState<Nation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [selected, setSelected] = useState<Nation | null>(null);
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

  const API = 'https://world-dominion.onrender.com';

  useEffect(() => {
    fetch(`${API}/api/nations`)
      .then(r => r.json())
      .then(d => setNations(d.nations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() =>
    nations.filter(n =>
      n.name?.toLowerCase().includes(search.toLowerCase()) ||
      n.continent?.toLowerCase().includes(search.toLowerCase()) ||
      n.ideology?.toLowerCase().includes(search.toLowerCase())
    ), [nations, search]);

  const fmt = (n?: number) => n ? (n >= 1e12 ? `$${(n/1e12).toFixed(1)}T` : n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : `$${(n/1e6).toFixed(0)}M`) : '—';

  // Nation detail modal
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
            <div style={{ fontSize: '10px', color: '#8892a4', letterSpacing: '2px' }}>{selected.capital} · {selected.continent}</div>
            {atWar && <div style={{ marginTop: '8px', fontSize: '9px', color: '#cc0000', letterSpacing: '2px' }}>⚔️ ACTIVE CONFLICT</div>}
            {selected.occupiedBy && <div style={{ marginTop: '4px', fontSize: '9px', color: '#cc0000', letterSpacing: '2px' }}>🔴 OCCUPIED</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: 'GDP', value: fmt(selected.gdp), icon: '💵' },
              { label: 'MILITARY', value: selected.militaryStrength?.toLocaleString() || '—', icon: '🪖' },
              { label: 'STABILITY', value: selected.stability ? `${selected.stability}/100` : '—', icon: '📊' },
              { label: 'PLAYERS', value: selected.playerCount?.toString() || '0', icon: '👥' },
              { label: 'IDEOLOGY', value: selected.ideology || '—', icon: '🏛️' },
              { label: 'AT WAR', value: selected.atWarWith?.length ? `${selected.atWarWith.length} wars` : 'PEACE', icon: atWar ? '⚔️' : '🕊️' },
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
          placeholder="SEARCH NATIONS, CONTINENT, IDEOLOGY..."
          style={{
            width: '100%', padding: '11px 14px', marginBottom: '14px',
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(139,0,0,0.4)',
            borderRadius: '8px', color: '#e8e8e8', fontSize: '11px',
            letterSpacing: '1px', outline: 'none', fontFamily: 'monospace',
            boxSizing: 'border-box',
          }}
        />

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#444', padding: '30px', fontSize: '10px', letterSpacing: '2px' }}>NO NATIONS FOUND</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '8px', color: '#8892a4', letterSpacing: '2px', marginBottom: '4px' }}>
              {filtered.length} NATIONS · TAP FOR INTEL
            </div>
            {filtered.map(n => {
              const atWar = (n.atWarWith?.length || 0) > 0;
              return (
                <div key={n.id}
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
                      {n.continent}{n.ideology ? ` · ${n.ideology}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {atWar && <div style={{ fontSize: '8px', color: '#cc0000', letterSpacing: '1px' }}>⚔️ AT WAR</div>}
                    {n.playerCount ? <div style={{ fontSize: '9px', color: '#8892a4', marginTop: '2px' }}>👥 {n.playerCount}</div> : null}
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
