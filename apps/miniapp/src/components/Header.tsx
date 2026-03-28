import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const router = useRouter();
  const { user, player } = useAuth();

  const initials  = user?.firstName?.[0]?.toUpperCase() || '?';
  const firstName = user?.firstName?.toUpperCase() || 'COMMANDER';
  const warBonds  = player?.wallet?.warBonds ?? player?.stats?.warBonds ?? 0;
  const cp        = player?.wallet?.commandPoints ?? player?.stats?.commandPoints ?? 0;

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <header style={{
      background:    'linear-gradient(180deg, #0a0e1a 0%, #050810 100%)',
      borderBottom:  '1px solid rgba(139,0,0,0.5)',
      padding:       '8px 14px',
      display:       'flex',
      alignItems:    'center',
      justifyContent: 'space-between',
      position:      'sticky',
      top:           0,
      zIndex:        100,
      boxShadow:     '0 2px 20px rgba(139,0,0,0.25)',
    }}>

      {/* Left: Logo + Title */}
      <div
        onClick={() => router.push('/dashboard')}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
      >
        <img
          src="/logo.png"
          style={{
            width:     '30px',
            height:    '30px',
            borderRadius: '50%',
            border:    '1px solid rgba(139,0,0,0.8)',
            boxShadow: '0 0 8px rgba(139,0,0,0.5)',
          }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '3px', color: '#FFD700', textShadow: '0 0 10px rgba(255,215,0,0.4)', lineHeight: 1 }}>
            WORLD DOMINION
          </div>
          <div style={{ fontSize: '8px', color: '#8B0000', letterSpacing: '2px' }}>
            ⚔️ COMMAND CENTER
          </div>
        </div>
      </div>

      {/* Right: Currency + Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Currency pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
          <div style={{
            display:       'flex',
            alignItems:    'center',
            gap:           '4px',
            background:    'rgba(255,215,0,0.08)',
            border:        '1px solid rgba(255,215,0,0.25)',
            borderRadius:  '10px',
            padding:       '2px 8px',
          }}>
            <span style={{ fontSize: '10px' }}>💎</span>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#FFD700', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
              {fmt(warBonds)}
            </span>
          </div>
          <div style={{
            display:       'flex',
            alignItems:    'center',
            gap:           '4px',
            background:    'rgba(0,255,136,0.06)',
            border:        '1px solid rgba(0,255,136,0.2)',
            borderRadius:  '10px',
            padding:       '2px 8px',
          }}>
            <span style={{ fontSize: '10px' }}>⚡</span>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#00ff88', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
              {fmt(cp)}
            </span>
          </div>
        </div>

        {/* Profile avatar */}
        <div
          onClick={() => router.push('/profile')}
          style={{
            width:         '34px',
            height:        '34px',
            borderRadius:  '50%',
            background:    'linear-gradient(135deg, #8B0000, #cc0000)',
            display:       'flex',
            alignItems:    'center',
            justifyContent: 'center',
            fontSize:      '15px',
            fontWeight:    'bold',
            color:         '#FFD700',
            border:        '1px solid rgba(255,215,0,0.4)',
            cursor:        'pointer',
            boxShadow:     '0 0 10px rgba(139,0,0,0.4)',
            flexShrink:    0,
          }}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
