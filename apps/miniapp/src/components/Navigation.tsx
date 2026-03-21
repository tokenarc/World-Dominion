import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { id: '/', label: 'HQ', icon: '🏛️' },
  { id: '/nations', label: 'MAP', icon: '🌍' },
  { id: '/war', label: 'WAR', icon: '⚔️' },
  { id: '/market', label: 'TRADE', icon: '📈' },
  { id: '/wallet', label: 'VAULT', icon: '💰' },
  { id: '/apply', label: 'ENLIST', icon: '🎖️' }
];

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'linear-gradient(180deg, #0a0e1a 0%, #050810 100%)',
      borderTop: '1px solid #8B0000',
      boxShadow: '0 -4px 20px rgba(139,0,0,0.4)',
      padding: '6px 0 8px',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            style={{
              background: 'none', border: 'none',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '2px',
              padding: '4px 8px', cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s'
            }}
          >
            {currentPath === item.id && (
              <div style={{
                position: 'absolute', top: '-6px',
                left: '50%', transform: 'translateX(-50%)',
                width: '30px', height: '2px',
                background: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
                borderRadius: '2px'
              }} />
            )}
            <div style={{
              fontSize: '20px',
              filter: currentPath === item.id 
                ? 'drop-shadow(0 0 6px #FFD700)' 
                : 'grayscale(60%)',
              transform: currentPath === item.id ? 'scale(1.2)' : 'scale(1)',
              transition: 'all 0.2s'
            }}>
              {item.icon}
            </div>
            <div style={{
              fontSize: '8px', letterSpacing: '1px', fontWeight: 'bold',
              color: currentPath === item.id ? '#FFD700' : '#8892a4'
            }}>
              {item.label}
            </div>
          </button>
        ))}
      </div>
    </nav>
  );
}
