import { useState, useEffect } from 'react';
import { useAuth } from '../src/context/AuthContext';
import Layout from '../src/components/Layout';

interface Stock { id: string; companyId?: string; name: string; price: number; priceHistory?: number[]; sector?: string; nationId?: string; }
interface Listing { id: string; itemName: string; price: number; currency: string; sellerId: string; expiresAt: number; }

function Spinner() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}><div style={{ width: '20px', height: '20px', border: '2px solid rgba(139,0,0,0.3)', borderTop: '2px solid #FFD700', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
}

export default function MarketPage() {
  const { token } = useAuth();
  const [tab,      setTab]      = useState<'stocks'|'p2p'>('stocks');
  const [stocks,   setStocks]   = useState<Stock[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [msg,      setMsg]      = useState('');
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
  const API = 'https://world-dominion.onrender.com';

  useEffect(() => {
    setLoading(true);
    if (tab === 'stocks') {
      fetch(`${API}/api/market/stocks`).then(r => r.json()).then(d => setStocks(d.stocks || [])).catch(() => {}).finally(() => setLoading(false));
    } else {
      fetch(`${API}/api/market/p2p`).then(r => r.json()).then(d => setListings(d.listings || [])).catch(() => {}).finally(() => setLoading(false));
    }
  }, [tab]);

  const buyP2P = async (listingId: string) => {
    if (!token) return;
    tg?.HapticFeedback?.impactOccurred('medium');
    try {
      const res  = await fetch(`${API}/api/market/p2p/buy/${listingId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMsg(data.success ? '✅ Purchased!' : `❌ ${data.error}`);
      tg?.HapticFeedback?.notificationOccurred(data.success ? 'success' : 'error');
    } catch { setMsg('❌ Network error'); }
  };

  return (
    <Layout>
      <div style={{ padding: '12px', paddingBottom: '80px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '9px', color: '#8B0000', letterSpacing: '4px', marginBottom: '4px' }}>📈 GLOBAL EXCHANGE</div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFD700', letterSpacing: '2px' }}>MARKET TERMINAL</div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(139,0,0,0.2)' }}>
          {(['stocks', 'p2p'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setMsg(''); tg?.HapticFeedback?.impactOccurred('light'); }}
              style={{ flex: 1, padding: '9px', background: tab === t ? 'linear-gradient(135deg, #8B0000, #cc0000)' : 'none', border: 'none', borderRadius: '6px', color: tab === t ? '#fff' : '#8892a4', fontSize: '9px', letterSpacing: '2px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' as const }}>
              {t === 'stocks' ? '📊 STOCKS' : '🏪 P2P MARKET'}
            </button>
          ))}
        </div>

        {msg && <div style={{ textAlign: 'center', fontSize: '11px', color: msg.startsWith('✅') ? '#00ff88' : '#cc0000', marginBottom: '12px', letterSpacing: '1px' }}>{msg}</div>}

        {loading ? <Spinner /> : tab === 'stocks' ? (
          stocks.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#444', padding: '30px', fontSize: '10px', letterSpacing: '2px' }}>MARKET CLOSED</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {stocks.map(s => {
                const hist    = s.priceHistory || [];
                const prev    = hist.length > 1 ? hist[hist.length - 2] : s.price;
                const change  = s.price - prev;
                const pct     = prev > 0 ? ((change / prev) * 100).toFixed(1) : '0.0';
                const up      = change >= 0;
                return (
                  <div key={s.id} style={{
                    background:   'linear-gradient(135deg, #0d1117, #161b22)',
                    border:       `1px solid ${up ? 'rgba(0,255,136,0.2)' : 'rgba(204,0,0,0.2)'}`,
                    borderRadius: '10px',
                    padding:      '12px',
                    position:     'relative',
                    overflow:     'hidden',
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${up ? '#00ff88' : '#cc0000'}, transparent)` }} />
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#e8e8e8', letterSpacing: '1px', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    {s.sector && <div style={{ fontSize: '8px', color: '#8892a4', letterSpacing: '1px', marginBottom: '8px' }}>{s.sector}</div>}
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#FFD700', fontFamily: 'monospace' }}>{s.price?.toFixed(0)}</div>
                    <div style={{ fontSize: '9px', color: up ? '#00ff88' : '#cc0000', marginTop: '3px', fontFamily: 'monospace' }}>
                      {up ? '▲' : '▼'} {Math.abs(parseFloat(pct))}%
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          listings.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#444', padding: '30px', fontSize: '10px', letterSpacing: '2px' }}>NO ACTIVE LISTINGS</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {listings.map(l => (
                <div key={l.id} style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '10px',
                  padding:      '12px',
                  background:   'linear-gradient(135deg, #0d1117, #161b22)',
                  border:       '1px solid rgba(139,0,0,0.3)',
                  borderRadius: '10px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#e8e8e8', fontWeight: 'bold', letterSpacing: '1px' }}>{l.itemName}</div>
                    <div style={{ fontSize: '9px', color: '#8892a4', marginTop: '3px' }}>
                      {l.currency} · Expires {new Date(l.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#FFD700', fontFamily: 'monospace' }}>{l.price}</div>
                    <button onClick={() => buyP2P(l.id)}
                      style={{ marginTop: '6px', padding: '5px 12px', background: 'linear-gradient(135deg, #cc0000, #8B0000)', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '9px', letterSpacing: '1px', fontWeight: 'bold', cursor: 'pointer' }}>
                      BUY
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </Layout>
  );
}
