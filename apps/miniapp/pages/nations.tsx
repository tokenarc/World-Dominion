import dynamic from 'next/dynamic';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import Layout from '../src/components/Layout';

const NationsPageContent = dynamic(() => Promise.resolve(NationsPage), { ssr: false });

export default NationsPageContent;

interface Nation {
  _id?: any;
  iso: string;
  name: string;
  flag: string;
  capital?: string;
  continent?: string;
  population: number;
  gdp: number;
  stability: number;
  militaryStrength?: number;
  militaryLevel?: number;
  economyLevel?: number;
  atWarWith: string[];
  borders?: string[];
  alliances?: string[];
  primaryReligion?: string;
  ideology?: string;
  resources?: string[];
  treasury?: number;
}

const ROLES = [
  { id: "president", name: "President", description: "Head of state. Supreme political authority." },
  { id: "prime_minister", name: "Prime Minister", description: "Executive leader in parliamentary systems." },
  { id: "finance_minister", name: "Finance Minister", description: "Controls national treasury." },
  { id: "defense_minister", name: "Defense Minister", description: "Manages military affairs." },
  { id: "foreign_minister", name: "Foreign Minister", description: "Manages diplomatic relations." },
  { id: "intelligence_chief", name: "Intelligence Chief", description: "Leads intelligence agencies." },
  { id: "trade_minister", name: "Trade Minister", description: "Manages trade agreements." },
  { id: "religious_leader", name: "Religious Leader", description: "Spiritual authority." },
];

const CONTINENTS = ["ALL", "ASIA", "EUROPE", "NORTH AMERICA", "SOUTH AMERICA", "AFRICA", "OCEANIA"];

function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', gap: '10px' }}>
      <div style={{ width: '24px', height: '24px', border: '2px solid rgba(139,0,0,0.3)', borderTop: '2px solid #cc0000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize: '9px', color: '#8892a4', letterSpacing: '3px' }}>SCANNING GLOBE...</div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: '#0d1117', border: '1px solid rgba(139,0,0,0.2)', borderRadius: '10px', padding: '12px', height: '140px' }}>
      <div style={{ height: '16px', background: 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '4px', marginBottom: '8px' }} />
      <div style={{ height: '12px', width: '60%', background: 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '4px', marginBottom: '12px' }} />
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)', backgroundSize: '200% 100%', animation: 'shimimner 1.5s infinite', borderRadius: '2px', marginBottom: '8px' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ height: '10px', width: '30px', background: 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '2px' }} />
        <div style={{ height: '10px', width: '40px', background: 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '2px' }} />
      </div>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </div>
  );
}

function NationDetailModal({ nation, onClose, onApply }: { nation: Nation; onClose: () => void; onApply: (roleId: string) => void }) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [essay, setEssay] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  
  const fmt = (n?: number) => n ? (n >= 1e12 ? `$${(n/1e12).toFixed(1)}T` : n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : `$${(n/1e6).toFixed(0)}M`) : '—';
  const fmtPop = (n?: number) => n ? (n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : `${(n/1e3).toFixed(0)}K`) : '—';
  
  const stabilityColor = nation.stability > 70 ? '#00ff88' : nation.stability > 40 ? '#FFA500' : '#cc0000';
  
  useEffect(() => {
    tg?.HapticFeedback?.impactOccurred('light');
  }, []);
  
  const handleApplyClick = (roleId: string) => {
    setSelectedRole(roleId);
    setShowApplyModal(true);
    tg?.HapticFeedback?.impactOccurred('light');
  };
  
  const handleSubmit = async () => {
    if (!selectedRole || essay.length < 100 || essay.length > 500) return;
    setSubmitting(true);
    tg?.HapticFeedback?.impactOccurred('medium');
    onApply(selectedRole);
    setShowApplyModal(false);
    setSubmitting(false);
  };
  
  if (showApplyModal) {
    const role = ROLES.find(r => r.id === selectedRole);
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#0d1117', zIndex: 1000, padding: '16px',
        display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease',
      }}>
        <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        
        <button onClick={() => setShowApplyModal(false)} style={{ background: 'none', border: 'none', color: '#8892a4', fontSize: '12px', cursor: 'pointer', letterSpacing: '2px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ← BACK
        </button>
        
        <div style={{ background: 'linear-gradient(135deg, #0d1117, #1a0505)', border: '1px solid rgba(139,0,0,0.5)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>{nation.flag}</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#FFD700', letterSpacing: '2px' }}>{role?.name}</div>
          <div style={{ fontSize: '11px', color: '#8892a4', marginTop: '4px' }}>{role?.description}</div>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '10px', color: '#cc0000', letterSpacing: '2px', marginBottom: '8px' }}>WHY DO YOU WANT THIS ROLE?</div>
          <textarea
            value={essay}
            onChange={e => setEssay(e.target.value)}
            placeholder="State your qualifications and strategy..."
            style={{
              flex: 1, minHeight: '150px', padding: '12px',
              background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(139,0,0,0.4)',
              borderRadius: '8px', color: '#e8e8e8', fontSize: '12px',
              letterSpacing: '1px', fontFamily: 'monospace', resize: 'none',
              outline: 'none',
            }}
          />
          <div style={{ fontSize: '10px', color: essay.length < 100 ? '#8892a4' : '#00ff88', marginTop: '4px', textAlign: 'right' }}>
            {essay.length}/500 (min 100)
          </div>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={submitting || essay.length < 100 || essay.length > 500}
          style={{
            width: '100%', padding: '14px', marginTop: '16px',
            background: submitting || essay.length < 100 ? 'rgba(139,0,0,0.3)' : 'linear-gradient(135deg, #8B0000, #cc0000)',
            border: '1px solid rgba(204,0,0,0.4)', borderRadius: '10px',
            color: '#fff', fontSize: '12px', letterSpacing: '2px', fontWeight: 'bold',
            cursor: submitting || essay.length < 100 ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
        </button>
      </div>
    );
  }
  
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#0d1117', zIndex: 1000, padding: '16px',
      display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease',
      overflowY: 'auto',
    }}>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '36px', marginBottom: '4px' }}>{nation.flag}</div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#FFD700', letterSpacing: '2px', fontFamily: 'Orbitron, monospace' }}>{nation.name}</div>
          <div style={{ fontSize: '10px', color: '#8892a4', marginTop: '2px' }}>
            {nation.continent} • <span style={{ background: 'rgba(139,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>{nation.ideology}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8892a4', fontSize: '20px', cursor: 'pointer' }}>✕</button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: 'STABILITY', value: `${nation.stability}/100`, color: stabilityColor, progress: nation.stability },
          { label: 'MILITARY', value: `Lvl ${nation.militaryLevel || 1}`, progress: (nation.militaryLevel || 1) * 10 },
          { label: 'ECONOMY', value: `Lvl ${nation.economyLevel || 1}`, progress: (nation.economyLevel || 1) * 10 },
          { label: 'GDP', value: fmt(nation.gdp) },
          { label: 'POPULATION', value: fmtPop(nation.population) },
          { label: 'RELIGION', value: nation.primaryReligion || '—' },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#161b22', border: '1px solid rgba(139,0,0,0.2)', borderRadius: '8px', padding: '10px' }}>
            <div style={{ fontSize: '10px', color: '#8892a4', letterSpacing: '1px', marginBottom: '4px' }}>{stat.label}</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: stat.color || '#e8e8e8', fontFamily: 'monospace' }}>{stat.value}</div>
            {stat.progress !== undefined && (
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stat.progress}%`, background: stat.color || '#cc0000', borderRadius: '2px' }} />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {nation.resources && nation.resources.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '9px', color: '#8892a4', letterSpacing: '2px', marginBottom: '6px' }}>RESOURCES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {nation.resources.map((r, i) => (
              <span key={i} style={{ fontSize: '9px', background: 'rgba(139,0,0,0.3)', color: '#FFD700', padding: '3px 8px', borderRadius: '4px', letterSpacing: '1px' }}>{r}</span>
            ))}
          </div>
        </div>
      )}
      
      {nation.alliances && nation.alliances.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '9px', color: '#8892a4', letterSpacing: '2px', marginBottom: '6px' }}>ALLIANCES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {nation.alliances.map((a, i) => (
              <span key={i} style={{ fontSize: '9px', background: 'rgba(0,255,136,0.2)', color: '#00ff88', padding: '3px 8px', borderRadius: '4px', letterSpacing: '1px' }}>{a}</span>
            ))}
          </div>
        </div>
      )}
      
      {nation.borders && nation.borders.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '9px', color: '#8892a4', letterSpacing: '2px', marginBottom: '6px' }}>BORDERS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {nation.borders.map((b, i) => (
              <span key={i} style={{ fontSize: '9px', background: 'rgba(139,0,0,0.3)', color: '#8892a4', padding: '3px 8px', borderRadius: '4px', letterSpacing: '1px' }}>{b}</span>
            ))}
          </div>
        </div>
      )}
      
      <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
        <div style={{ fontSize: '10px', color: '#cc0000', letterSpacing: '3px', marginBottom: '10px' }}>🎖️ GOVERNMENT POSITIONS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {ROLES.map((role) => (
            <div key={role.id} style={{ background: '#161b22', border: '1px solid rgba(139,0,0,0.2)', borderRadius: '8px', padding: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#e8e8e8', marginBottom: '2px' }}>{role.name}</div>
              <div style={{ fontSize: '9px', color: '#00ff88', marginBottom: '6px' }}>VACANT</div>
              <button
                onClick={() => handleApplyClick(role.id)}
                style={{
                  width: '100%', padding: '6px',
                  background: 'rgba(139,0,0,0.3)', border: '1px solid rgba(204,0,0,0.4)',
                  borderRadius: '4px', color: '#cc0000', fontSize: '9px', letterSpacing: '1px',
                  cursor: 'pointer',
                }}
              >
                APPLY
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NationsPage() {
  const { state, token } = useAuth();
  const apiRef = api as any;
  
  const nations = state === 'ready' && apiRef?.nations?.getAll
    ? useQuery(apiRef.nations.getAll)
    : 'skip';
  
  const submitApplication = useMutation(
    state === 'ready' && apiRef?.roles?.submitApplication 
      ? apiRef.roles.submitApplication 
      : 'skip'
  );
  
  const [search, setSearch] = useState('');
  const [continent, setContinent] = useState('ALL');
  const [selectedNation, setSelectedNation] = useState<Nation | null>(null);
  const [loading, setLoading] = useState(true);
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  
  useEffect(() => {
    if (nations !== undefined) setLoading(false);
  }, [nations]);
  
  useEffect(() => {
    tg?.ready();
  }, [tg]);
  
  const filtered = useMemo(() => {
    if (!nations || !Array.isArray(nations)) return [];
    let arr = nations as Nation[];
    if (continent !== 'ALL') {
      arr = arr.filter(n => n.continent?.toUpperCase() === continent);
    }
    if (search) {
      arr = arr.filter(n =>
        n.name?.toLowerCase().includes(search.toLowerCase()) ||
        n.iso?.toLowerCase().includes(search.toLowerCase())
      );
    }
    return arr;
  }, [nations, continent, search]);
  
  const fmt = (n?: number) => n ? (n >= 1e12 ? `$${(n/1e12).toFixed(1)}T` : n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : `$${(n/1e6).toFixed(0)}M`) : '—';
  
  const handleApply = async (roleId: string) => {
    if (!selectedNation || !token) return;
    try {
      const role = ROLES.find(r => r.id === roleId);
      await submitApplication({
        token,
        nationIso: selectedNation.iso,
        roleId,
        roleName: role?.name || roleId,
        essay: 'Applying for role in ' + selectedNation.name,
      });
    } catch (e) {
      console.error(e);
    }
  };
  
  if (selectedNation) {
    return <NationDetailModal nation={selectedNation} onClose={() => setSelectedNation(null)} onApply={handleApply} />;
  }
  
  return (
    <Layout>
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400px); }
        }
      `}</style>
      <div style={{ padding: '12px', paddingBottom: '80px' }}>
        
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '9px', color: '#8B0000', letterSpacing: '4px', marginBottom: '4px' }}>🌍 INTELLIGENCE DATABASE</div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFD700', letterSpacing: '2px', fontFamily: 'Orbitron, monospace' }}>
            {nations?.length || '??'} NATIONS
          </div>
        </div>
        
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="SEARCH NATIONS..."
          style={{
            width: '100%', padding: '11px 14px', marginBottom: '12px',
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(139,0,0,0.4)',
            borderRadius: '8px', color: '#e8e8e8', fontSize: '11px',
            letterSpacing: '1px', outline: 'none', fontFamily: 'monospace',
            boxSizing: 'border-box',
            boxShadow: search ? '0 0 10px rgba(204,0,0,0.3)' : 'none',
            transition: 'box-shadow 0.2s',
          }}
        />
        
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
          {CONTINENTS.map(c => (
            <button
              key={c}
              onClick={() => { setContinent(c); tg?.HapticFeedback?.impactOccurred('light'); }}
              style={{
                padding: '6px 12px',
                background: continent === c ? 'rgba(139,0,0,0.5)' : 'rgba(0,0,0,0.3)',
                border: `1px solid ${continent === c ? '#cc0000' : 'rgba(139,0,0,0.2)'}`,
                borderRadius: '6px', color: continent === c ? '#cc0000' : '#8892a4',
                fontSize: '9px', letterSpacing: '1px', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {c}
            </button>
          ))}
        </div>
        
        {loading || nations === null || nations === undefined ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#444', padding: '30px', fontSize: '10px', letterSpacing: '2px' }}>NO NATIONS FOUND</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {filtered.map((n: Nation) => {
              const atWar = (n.atWarWith?.length || 0) > 0;
              const stabilityColor = n.stability > 70 ? '#00ff88' : n.stability > 40 ? '#FFA500' : '#cc0000';
              return (
                <div
                  key={n.iso}
                  onClick={() => { setSelectedNation(n); tg?.HapticFeedback?.impactOccurred('light'); }}
                  style={{
                    background: '#0d1117',
                    border: `1px solid ${atWar ? 'rgba(204,0,0,0.4)' : 'rgba(139,0,0,0.2)'}`,
                    borderRadius: '10px', padding: '12px', height: '140px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{n.flag}</span>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#e8e8e8', letterSpacing: '1px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name}</span>
                  </div>
                  
                  <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${n.stability}%`, background: stabilityColor, borderRadius: '2px' }} />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#8892a4', marginTop: 'auto' }}>
                    <span>⚔️ {n.militaryStrength || '?'}</span>
                    <span>{fmt(n.gdp)}</span>
                    {atWar && <span style={{ color: '#cc0000' }}>🔴</span>}
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