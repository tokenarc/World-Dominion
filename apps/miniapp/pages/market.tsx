import { useState } from 'react';
import { useAuth } from '../src/context/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/client';
import Layout from '../src/components/Layout';

interface Stock { _id?: any; symbol: string; name: string; price: number; change24h: number; sector: string; }

function Spinner() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}><div style={{ width: '20px', height: '20px', border: '2px solid rgba(139,0,0,0.3)', borderTop: '2px solid #FFD700', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
}

export default function MarketPage() {
  const { sessionToken, authStage } = useAuth();
  const [tab,      setTab]      = useState<'stocks'|'p2p'>('stocks');
  const [msg,      setMsg]      = useState('');
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

  const apiRef = api as any;
  const stocks = authStage === 'ready' && apiRef?.market?.getStocks ? useQuery(apiRef.market.getStocks) : null;
  const listings = authStage === 'ready' && apiRef?.market?.getListings ? useQuery(apiRef.market.getListings, tab === 'p2p' ? {} : 'skip') : null;
  const buyMutation = authStage === 'ready' && apiRef?.market?.buyListing ? useMutation(apiRef.market.buyListing) : null;

  const buyP2P = async (listingId: any, quantity: number) => {
    if (!sessionToken || !buyMutation) return;
    tg?.HapticFeedback?.impactOccurred('medium');
    try {
      const result = await buyMutation({ token: sessionToken, listingId, quantity });
      setMsg('✅ Purchased!');
      tg?.HapticFeedback?.notificationOccurred('success');
    } catch (err: any) {
      setMsg(`❌ ${err.message || 'Purchase failed'}`);
      tg?.HapticFeedback?.notificationOccurred('error');
    }
  };

  return (
    <Layout>
      <div style={{ padding: '12px', paddingBottom: '80px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '9px', color: '#8B0000', letterSpacing: '4px', marginBottom: '4px' }}>📈 GLOBAL EXCHANGE</div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFD700', letterSpacing: '2px' }}>MARKET TERMINAL</div>
        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(139,0,0,0.2)' }}>
          {(['stocks', 'p2p'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setMsg(''); tg?.HapticFeedback?.impactOccurred('light'); }}
              style={{ flex: 1, padding: '9px', background: tab === t ? 'linear-gradient(135deg, #8B0000, #cc0000)' : 'none', border: 'none', borderRadius: '6px', color: tab === t ? '#fff' : '#8892a4', fontSize: '9px', letterSpacing: '2px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' as const }}>
              {t === 'stocks' ? '📊 STOCKS' : '🏪 P2P MARKET'}
            </button>
          ))}
        </div>

        {msg && <div style={{ textAlign: 'center', fontSize: '11px', color: msg.startsWith('✅') ? '#00ff88' : '#cc0000', marginBottom: '12px', letterSpacing: '1px' }}>{msg}</div>}

        {tab === 'stocks' ? (
          stocks === null || stocks === undefined ? <Spinner /> : (stocks as any).length === 0 ? (
            <div style={{ textAlign: 'center', color: '#444', padding: '30px', fontSize: '10px', letterSpacing: '2px' }}>MARKET CLOSED</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {stocks.map((s: Stock) => {
                const change = s.change24h || 0;
                const up = change >= 0;
                return (
                  <div key={s.symbol} style={{
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
                      {up ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          listings === null || listings === undefined ? <Spinner /> : (listings as any).length === 0 ? (
            <div style={{ textAlign: 'center', color: '#444', padding: '30px', fontSize: '10px', letterSpacing: '2px' }}>NO ACTIVE LISTINGS</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {listings.map((l: any) => (
                <div key={l._id} style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '10px',
                  padding:      '12px',
                  background:   'linear-gradient(135deg, #0d1117, #161b22)',
                  border:       '1px solid rgba(139,0,0,0.3)',
                  borderRadius: '10px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#e8e8e8', fontWeight: 'bold', letterSpacing: '1px' }}>{l.itemType}</div>
                    <div style={{ fontSize: '9px', color: '#8892a4', marginTop: '3px' }}>
                      {l.pricePerUnit} WRB · {l.quantity} available
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#FFD700', fontFamily: 'monospace' }}>{l.totalPrice}</div>
                    <button onClick={() => buyP2P(l._id, 1)}
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