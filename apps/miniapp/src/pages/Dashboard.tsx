import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ icon, label, value, color = '#FFD700' }: any) => (
  <div style={{
    background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
    border: `1px solid #8B0000`,
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
      background: `linear-gradient(90deg, transparent, ${color}, transparent)`
    }} />
    <div style={{ fontSize: '24px' }}>{icon}</div>
    <div>
      <div style={{ fontSize: '9px', color: '#8892a4', letterSpacing: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 'bold', color }}>{value}</div>
    </div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, player } = useAuth();
  const firstName = user?.firstName?.toUpperCase() || 'COMMANDER';

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      
      {/* Commander Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1117 0%, #1a0505 100%)',
        border: '1px solid #8B0000',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 80% 50%, rgba(139,0,0,0.15) 0%, transparent 70%)'
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: '10px', color: '#8B0000', letterSpacing: '3px', marginBottom: '4px' }}>
            ⚔️ ACTIVE COMMANDER
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#FFD700', letterSpacing: '2px' }}>
            {firstName}
          </div>
          <div style={{ fontSize: '11px', color: '#8892a4', marginTop: '4px' }}>
            {player?.stats?.role || 'No Role Assigned'} 
            {player?.stats?.nation ? ` • ${player.stats.nation}` : ' • Apply for a role'}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '8px', marginBottom: '16px'
      }}>
        <StatCard icon="🌍" label="NATION" value={player?.stats?.nation || 'UNASSIGNED'} />
        <StatCard icon="🎖️" label="ROLE" value={player?.stats?.role || 'CIVILIAN'} color="#cc0000" />
        <StatCard icon="⚔️" label="STATUS" value="ACTIVE" color="#00ff88" />
        <StatCard icon="🏆" label="RANK" value="COMMANDER" color="#FFD700" />
      </div>

      {/* Intel Feed */}
      <div style={{
        background: '#0d1117',
        border: '1px solid #8B0000',
        borderRadius: '8px',
        marginBottom: '16px',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid #8B0000',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <span style={{ fontSize: '12px', color: '#8B0000' }}>📡</span>
          <span style={{ fontSize: '11px', letterSpacing: '3px', color: '#FFD700' }}>INTEL FEED</span>
          <div style={{ 
            marginLeft: 'auto', width: '6px', height: '6px',
            borderRadius: '50%', background: '#00ff88',
            boxShadow: '0 0 6px #00ff88'
          }} />
        </div>
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '10px', color: '#8B0000', letterSpacing: '2px', marginBottom: '6px' }}>
            CLASSIFIED — EYES ONLY
          </div>
          <div style={{ fontSize: '12px', color: '#8892a4', lineHeight: '1.6' }}>
            Welcome to World Dominion. 195 nations await your command. 
            Apply for a role to begin your conquest.
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '8px'
      }}>
        {[
          { label: 'VIEW NATIONS', icon: '🌍', color: '#8B0000', path: '/nations' },
          { label: 'DAILY MISSIONS', icon: '🎯', color: '#FFD700', path: '/missions' },
          { label: 'WAR ROOM', icon: '⚔️', color: '#cc0000', path: '/war' },
          { label: 'INTELLIGENCE', icon: '🕵️', color: '#8892a4', path: '/profile' }
        ].map((btn: any) => (
          <button 
            key={btn.label} 
            onClick={() => navigate(btn.path)}
            style={{
              background: 'linear-gradient(135deg, #0d1117, #161b22)',
              border: `1px solid ${btn.color}`,
              borderRadius: '8px',
              padding: '12px 8px',
              color: btn.color,
              fontSize: '10px',
              letterSpacing: '2px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: `0 0 10px ${btn.color}20`
            }}
          >
            <span style={{ fontSize: '20px' }}>{btn.icon}</span>
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
