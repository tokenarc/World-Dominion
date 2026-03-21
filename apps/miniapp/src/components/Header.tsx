import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const initials = user?.firstName?.[0]?.toUpperCase() || '?';
  const firstName = user?.firstName?.toUpperCase() || 'COMMANDER';

  return (
    <header style={{
      background: 'linear-gradient(180deg, #0a0e1a 0%, #050810 100%)',
      borderBottom: '1px solid #8B0000',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 20px rgba(139,0,0,0.3)'
    }}>
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        onClick={() => navigate('/')}
      >
        <img 
          src="/logo.png" 
          style={{ width: '32px', height: '32px', borderRadius: '50%',
            border: '1px solid #8B0000',
            boxShadow: '0 0 8px rgba(139,0,0,0.6)'
          }} 
        />
        <div>
          <div style={{ 
            fontSize: '14px', fontWeight: 900, 
            letterSpacing: '3px', color: '#FFD700',
            textShadow: '0 0 10px rgba(255,215,0,0.5)'
          }}>
            WORLD DOMINION
          </div>
          <div style={{ fontSize: '9px', color: '#8B0000', letterSpacing: '2px' }}>
            ⚔️ COMMAND CENTER
          </div>
        </div>
      </div>
      <div 
        style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => navigate('/profile')}
      >
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '9px', color: '#8892a4', letterSpacing: '1px' }}>COMMANDER</div>
          <div style={{ fontSize: '11px', color: '#FFD700', fontWeight: 'bold' }}>{firstName}</div>
        </div>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #8B0000, #cc0000)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', border: '1px solid #FFD700', color: '#FFD700'
        }}>{initials}</div>
      </div>
    </header>
  );
}
