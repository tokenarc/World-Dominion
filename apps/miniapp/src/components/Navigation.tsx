import { useRouter } from 'next/router';

const TABS = [
  { path: '/dashboard', icon: '🏛️', label: 'HQ'     },
  { path: '/nations',   icon: '🌍', label: 'MAP'    },
  { path: '/war',       icon: '⚔️', label: 'WAR'    },
  { path: '/market',    icon: '📈', label: 'TRADE'  },
  { path: '/wallet',    icon: '💰', label: 'VAULT'  },
];

export default function Navigation() {
  const router  = useRouter();
  const current = router.pathname;
  const tg      = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

  const go = (path: string) => {
    if (current === path) return;
    tg?.HapticFeedback?.impactOccurred('light');
    router.push(path);
  };

  return (
    <nav style={{
      position:      'fixed',
      bottom:        0,
      left:          0,
      right:         0,
      background:    'linear-gradient(180deg, #08091400 0%, #080914ff 12px)',
      backdropFilter: 'blur(12px)',
      borderTop:     '1px solid rgba(139,0,0,0.4)',
      boxShadow:     '0 -4px 24px rgba(139,0,0,0.3)',
      padding:       '6px 0 10px',
      zIndex:        200,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        {TABS.map(tab => {
          const active = current === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => go(tab.path)}
              style={{
                background:    'none',
                border:        'none',
                display:       'flex',
                flexDirection: 'column',
                alignItems:    'center',
                gap:           '3px',
                padding:       '4px 12px',
                cursor:        'pointer',
                position:      'relative',
                minWidth:      '52px',
              }}
            >
              {/* Active indicator */}
              {active && (
                <div style={{
                  position:     'absolute',
                  top:          '-6px',
                  left:         '50%',
                  transform:    'translateX(-50%)',
                  width:        '28px',
                  height:       '2px',
                  background:   'linear-gradient(90deg, transparent, #FFD700, transparent)',
                  borderRadius: '2px',
                }} />
              )}

              {/* Icon */}
              <div style={{
                fontSize:   '22px',
                filter:     active ? 'drop-shadow(0 0 8px rgba(255,215,0,0.8))' : 'grayscale(70%) opacity(0.6)',
                transform:  active ? 'scale(1.18) translateY(-1px)' : 'scale(1)',
                transition: 'all 0.2s ease',
              }}>
                {tab.icon}
              </div>

              {/* Label */}
              <div style={{
                fontSize:      '7px',
                letterSpacing: '1.5px',
                fontWeight:    'bold',
                color:         active ? '#FFD700' : '#555',
                fontFamily:    'monospace',
                transition:    'color 0.2s',
              }}>
                {tab.label}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
