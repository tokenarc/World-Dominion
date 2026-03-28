import { useState, useEffect } from 'react';
import { useAuth } from '../src/context/AuthContext';
import Layout from '../src/components/Layout';

interface Tx {
  type: string;
  currency: string;
  amount: number;
  wrbCredited?: number;
  timestamp: number;
  status: string;
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
      <div style={{ width: '20px', height: '20px', border: '2px solid rgba(139,0,0,0.3)', borderTop: '2px solid #FFD700', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function WalletPage() {
  const { player, token } = useAuth();
  const [txns,    setTxns]    = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<'balance'|'deposit'|'withdraw'>('balance');
  const [txHash,  setTxHash]  = useState('');
  const [crypto,  setCrypto]  = useState<'TON'|'USDT_TRC20'>('TON');
  const [amount,  setAmount]  = useState('');
  const [toAddr,  setToAddr]  = useState('');
  const [wrbAmt,  setWrbAmt]  = useState('');
  const [msg,     setMsg]     = useState('');
  const [busy,    setBusy]    = useState(false);
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

  const API      = 'https://world-dominion.onrender.com';
  const warBonds = player?.wallet?.warBonds ?? player?.stats?.warBonds ?? 0;
  const cp       = player?.wallet?.commandPoints ?? player?.stats?.commandPoints ?? 0;

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/wallet/transactions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setTxns(d.transactions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const verifyDeposit = async () => {
    if (!txHash.trim() || !token) return;
    tg?.HapticFeedback?.impactOccurred('medium');
    setBusy(true); setMsg('');
    try {
      const res  = await fetch(`${API}/api/wallet/deposit/verify`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ txHash: txHash.trim(), currency: crypto, expectedAmount: parseFloat(amount) || 0 }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`✅ Credited ${data.wrbCredited} War Bonds!`);
        tg?.HapticFeedback?.notificationOccurred('success');
      } else {
        setMsg(`❌ ${data.error || 'Verification failed'}`);
        tg?.HapticFeedback?.notificationOccurred('error');
      }
    } catch { setMsg('❌ Network error'); }
    finally { setBusy(false); }
  };

  const withdraw = async () => {
    if (!toAddr.trim() || !wrbAmt || !token) return;
    tg?.HapticFeedback?.impactOccurred('heavy');
    setBusy(true); setMsg('');
    try {
      const res  = await fetch(`${API}/api/wallet/withdraw`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ wrbAmount: parseInt(wrbAmt), toAddress: toAddr.trim(), currency: crypto }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`✅ Withdrawal submitted! ID: ${data.withdrawalId?.slice(-6)}`);
        tg?.HapticFeedback?.notificationOccurred('success');
      } else {
        setMsg(`❌ ${data.error}`);
        tg?.HapticFeedback?.notificationOccurred('error');
      }
    } catch { setMsg('❌ Network error'); }
    finally { setBusy(false); }
  };

  const TABS = ['balance', 'deposit', 'withdraw'] as const;

  return (
    <Layout>
      <div style={{ padding: '12px', paddingBottom: '80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '9px', color: '#8B0000', letterSpacing: '4px', marginBottom: '4px' }}>💰 TREASURY</div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFD700', letterSpacing: '2px' }}>VAULT</div>
        </div>

        {/* Balance cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'WAR BONDS', value: warBonds.toLocaleString(), icon: '💎', color: '#FFD700', sub: 'Premium Currency' },
            { label: 'CMD POINTS', value: cp.toLocaleString(), icon: '⚡', color: '#00ff88', sub: 'Free Currency' },
          ].map(c => (
            <div key={c.label} style={{
              background:    'linear-gradient(135deg, #0d1117, #161b22)',
              border:        `1px solid ${c.color}30`,
              borderRadius:  '14px',
              padding:       '16px 12px',
              position:      'relative',
              overflow:      'hidden',
              boxShadow:     `0 0 20px ${c.color}15`,
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${c.color}, transparent)` }} />
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{c.icon}</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: c.color, fontFamily: 'monospace', letterSpacing: '1px' }}>
                {c.value}
              </div>
              <div style={{ fontSize: '8px', color: '#8892a4', letterSpacing: '2px', marginTop: '4px' }}>{c.label}</div>
              <div style={{ fontSize: '8px', color: '#444', marginTop: '2px' }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(139,0,0,0.2)' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => { setTab(t); setMsg(''); tg?.HapticFeedback?.impactOccurred('light'); }}
              style={{
                flex:          1,
                padding:       '8px 4px',
                background:    tab === t ? 'linear-gradient(135deg, #8B0000, #cc0000)' : 'none',
                border:        'none',
                borderRadius:  '6px',
                color:         tab === t ? '#fff' : '#8892a4',
                fontSize:      '9px',
                letterSpacing: '1.5px',
                fontWeight:    'bold',
                cursor:        'pointer',
                textTransform: 'uppercase' as const,
              }}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'balance' && (
          loading ? <Spinner /> : txns.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#444', padding: '30px', fontSize: '11px', letterSpacing: '2px' }}>
              NO TRANSACTIONS YET
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {txns.slice(0, 20).map((tx, i) => (
                <div key={i} style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '10px',
                  padding:      '10px 12px',
                  background:   '#0d1117',
                  border:       '1px solid rgba(139,0,0,0.2)',
                  borderRadius: '8px',
                }}>
                  <div style={{ fontSize: '18px' }}>{tx.type === 'DEPOSIT' ? '📥' : '📤'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: '#c8ccd4', letterSpacing: '1px' }}>
                      {tx.type} · {tx.currency}
                    </div>
                    <div style={{ fontSize: '9px', color: '#8892a4', marginTop: '2px' }}>
                      {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: tx.type === 'DEPOSIT' ? '#00ff88' : '#cc0000', fontFamily: 'monospace' }}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.wrbCredited || tx.amount} WRB
                    </div>
                    <div style={{ fontSize: '8px', color: tx.status === 'confirmed' ? '#00ff88' : '#FFD700', letterSpacing: '1px' }}>
                      {tx.status?.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'deposit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '10px', color: '#8892a4', letterSpacing: '2px', lineHeight: '1.6' }}>
              Send crypto to the game wallet, then submit your TX hash to receive War Bonds.
            </div>

            {/* Crypto selector */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['TON', 'USDT_TRC20'] as const).map(c => (
                <button key={c} onClick={() => setCrypto(c)}
                  style={{
                    flex: 1, padding: '10px',
                    background:   crypto === c ? 'rgba(139,0,0,0.3)' : 'rgba(0,0,0,0.3)',
                    border:       `1px solid ${crypto === c ? '#cc0000' : 'rgba(139,0,0,0.2)'}`,
                    borderRadius: '8px', color: crypto === c ? '#FFD700' : '#8892a4',
                    fontSize: '10px', letterSpacing: '1px', fontWeight: 'bold', cursor: 'pointer',
                  }}>
                  {c === 'TON' ? '⚫ TON' : '🔷 USDT'}
                </button>
              ))}
            </div>

            {[
              { label: 'AMOUNT SENT', val: amount, set: setAmount, ph: '0.00', type: 'number' },
              { label: 'TX HASH', val: txHash, set: setTxHash, ph: 'Paste transaction hash...', type: 'text' },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: '8px', color: '#8892a4', letterSpacing: '2px', marginBottom: '6px' }}>{f.label}</div>
                <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} type={f.type}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(139,0,0,0.3)', borderRadius: '8px', color: '#e8e8e8', fontSize: '11px', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }} />
              </div>
            ))}

            <button onClick={verifyDeposit} disabled={busy}
              style={{ padding: '14px', background: busy ? '#333' : 'linear-gradient(135deg, #cc0000, #8B0000)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '11px', letterSpacing: '2px', fontWeight: 'bold', cursor: busy ? 'not-allowed' : 'pointer', boxShadow: busy ? 'none' : '0 0 20px rgba(204,0,0,0.4)' }}>
              {busy ? 'VERIFYING...' : 'VERIFY DEPOSIT'}
            </button>
            {msg && <div style={{ fontSize: '11px', color: msg.startsWith('✅') ? '#00ff88' : '#cc0000', letterSpacing: '1px', textAlign: 'center' }}>{msg}</div>}
          </div>
        )}

        {tab === 'withdraw' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '10px', color: '#8892a4', letterSpacing: '2px', lineHeight: '1.6' }}>
              Min: 500 WRB · Max: 10,000 WRB/day · KYC required above 5,000 WRB
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {(['TON', 'USDT_TRC20'] as const).map(c => (
                <button key={c} onClick={() => setCrypto(c)}
                  style={{ flex: 1, padding: '10px', background: crypto === c ? 'rgba(139,0,0,0.3)' : 'rgba(0,0,0,0.3)', border: `1px solid ${crypto === c ? '#cc0000' : 'rgba(139,0,0,0.2)'}`, borderRadius: '8px', color: crypto === c ? '#FFD700' : '#8892a4', fontSize: '10px', letterSpacing: '1px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {c === 'TON' ? '⚫ TON' : '🔷 USDT'}
                </button>
              ))}
            </div>

            {[
              { label: 'WAR BONDS AMOUNT', val: wrbAmt, set: setWrbAmt, ph: '500', type: 'number' },
              { label: 'WALLET ADDRESS', val: toAddr, set: setToAddr, ph: 'Your wallet address...', type: 'text' },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: '8px', color: '#8892a4', letterSpacing: '2px', marginBottom: '6px' }}>{f.label}</div>
                <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} type={f.type}
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(139,0,0,0.3)', borderRadius: '8px', color: '#e8e8e8', fontSize: '11px', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }} />
              </div>
            ))}

            <button onClick={withdraw} disabled={busy}
              style={{ padding: '14px', background: busy ? '#333' : 'linear-gradient(135deg, #FFD700, #cc8800)', border: 'none', borderRadius: '10px', color: '#000', fontSize: '11px', letterSpacing: '2px', fontWeight: 'bold', cursor: busy ? 'not-allowed' : 'pointer', boxShadow: busy ? 'none' : '0 0 20px rgba(255,215,0,0.3)' }}>
              {busy ? 'PROCESSING...' : 'WITHDRAW'}
            </button>
            {msg && <div style={{ fontSize: '11px', color: msg.startsWith('✅') ? '#00ff88' : '#cc0000', letterSpacing: '1px', textAlign: 'center' }}>{msg}</div>}
          </div>
        )}
      </div>
    </Layout>
  );
}
