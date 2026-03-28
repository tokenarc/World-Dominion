import { useRouter } from 'next/router';
import { useAuth } from '../src/context/AuthContext';
import Layout from '../src/components/Layout';

export default function ProfilePage() {
  const router = useRouter();
  const { user, player, logout } = useAuth();
  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

  const initials  = user?.firstName?.[0]?.toUpperCase() || '?';
  const fullName  = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Commander';
  const gameUID   = user?.id ? `WD-${String(user.id).slice(-6).toUpperCase()}` : 'WD-??????';
  const username  = user?.username ? `@${user.username}` : '—';
  const warBonds  = player?.wallet?.warBonds  ?? player?.stats?.warBonds  ?? 0;
  const cp        = player?.wallet?.commandPoints ?? player?.stats?.commandPoints ?? 0;
  const rep       = player?.reputation ?? player?.stats?.reputation ?? 50;
  const nation    = player?.currentNation || player?.nationId || '—';
  const role      = player?.currentRole   || player?.role      || 'Civilian';
  const joined    = player?.joinedAt ? new Date(player.joinedAt).toLocaleDateString() : '—';
  const kyc       = player?.kycVerified;

  const handleLogout = () => {
    tg?.HapticFeedback?.impactOccurred('heavy');
    tg?.showPopup({
      title:   'LOGOUT',
      message: 'End your command session?',
      buttons: [
        { id: 'confirm', type: 'destructive', text: 'LOGOUT' },
        { id: 'cancel',  type: 'cancel' },
      ],
    }, (id: string) => {
      if (id === 'confirm') { logout(); router.replace('/'); }
    });
  };

  const Row = ({ label, value, color = '#e8e8e8' }: any) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(139,0,0,0.1)' }}>
      <span style={{ fontSize: '10px', color: '#8892a4', letterSpacing: '2px' }}>{label}</span>
      <span style={{ fontSize: '11px', color, fontWeight: 'bold', letterSpacing: '1px', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );

  return (
    <Layout>
      <div style={{ padding: '12px', paddingBottom: '80px' }}>

        {/* Avatar + name */}
        <div style={{
          background:   'linear-gradient(135deg, #0d1117, #1a0505)',
          border:       '1px solid rgba(139,0,0,0.5)',
          borderRadius: '16px',
          padding:      '24px 20px',
          marginBottom: '12px',
          display:      'flex',
          gap:          '16px',
          alignItems:   'center',
          position:     'relative',
          overflow:     'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, #cc0000, transparent)' }} />

          {/* Avatar */}
          <div style={{
            width:          '72px',
            height:         '72px',
            borderRadius:   '50%',
            background:     'linear-gradient(135deg, #8B0000, #cc0000)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '28px',
            fontWeight:     'bold',
            color:          '#FFD700',
            border:         '2px solid rgba(255,215,0,0.4)',
            boxShadow:      '0 0 20px rgba(139,0,0,0.5)',
            flexShrink:     0,
          }}>
            {initials}
          </div>

          <div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#FFD700', letterSpacing: '2px', marginBottom: '4px' }}>{fullName.toUpperCase()}</div>
            <div style={{ fontSize: '10px', color: '#8892a4', letterSpacing: '1px', marginBottom: '3px' }}>{username}</div>
            <div style={{
              display:       'inline-flex',
              alignItems:    'center',
              gap:           '4px',
              background:    'rgba(139,0,0,0.2)',
              border:        '1px solid rgba(139,0,0,0.4)',
              borderRadius:  '6px',
              padding:       '3px 8px',
              fontSize:      '9px',
              color:         '#cc0000',
              letterSpacing: '1px',
              fontFamily:    'monospace',
            }}>
              {gameUID}
            </div>
          </div>
        </div>

        {/* Reputation */}
        <div style={{ background: '#0d1117', border: '1px solid rgba(139,0,0,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '9px', color: '#8892a4', letterSpacing: '2px' }}>REPUTATION</span>
            <span style={{ fontSize: '9px', color: '#FFD700', fontFamily: 'monospace' }}>{rep}/100</span>
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${rep}%`, background: 'linear-gradient(90deg, #8B0000, #FFD700)', borderRadius: '2px', transition: 'width 1s ease' }} />
          </div>
        </div>

        {/* Stats */}
        <div style={{ background: '#0d1117', border: '1px solid rgba(139,0,0,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '10px' }}>
          <div style={{ fontSize: '9px', color: '#8B0000', letterSpacing: '3px', marginBottom: '10px' }}>COMMAND PROFILE</div>
          <Row label="NATION"      value={nation}               color="#FFD700" />
          <Row label="ROLE"        value={role}                 color="#cc0000" />
          <Row label="WAR BONDS"   value={warBonds.toLocaleString()} color="#FFD700" />
          <Row label="CMD POINTS"  value={cp.toLocaleString()}  color="#00ff88" />
          <Row label="JOINED"      value={joined}               />
          <Row label="KYC"         value={kyc ? '✅ VERIFIED' : '⚠️ UNVERIFIED'} color={kyc ? '#00ff88' : '#FFD700'} />
        </div>

        {/* Telegram info */}
        <div style={{ background: '#0d1117', border: '1px solid rgba(139,0,0,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '10px' }}>
          <div style={{ fontSize: '9px', color: '#8B0000', letterSpacing: '3px', marginBottom: '10px' }}>TELEGRAM IDENTITY</div>
          <Row label="USERNAME"    value={username}             />
          <Row label="TELEGRAM ID" value={String(user?.telegramId || '—')} />
          <Row label="AUTH METHOD" value="WEBAPP HMAC"          color="#00ff88" />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            width:         '100%',
            padding:       '14px',
            background:    'linear-gradient(135deg, #1a0505, #0d1117)',
            border:        '1px solid rgba(204,0,0,0.4)',
            borderRadius:  '12px',
            color:         '#cc0000',
            fontSize:      '11px',
            letterSpacing: '3px',
            fontWeight:    'bold',
            cursor:        'pointer',
            boxShadow:     '0 0 15px rgba(204,0,0,0.1)',
          }}
        >
          ⏹ END SESSION
        </button>

      </div>
    </Layout>
  );
}
