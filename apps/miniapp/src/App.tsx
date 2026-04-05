import React, { useEffect, useState } from 'react';
import { VideoLoadingScreen } from './components/VideoLoadingScreen';
import { useAuth } from './context/AuthContext';

// Auth stage → real progress percentage
const STAGE_PROGRESS: Record<string, number> = {
  init:            5,
  authenticating:  30,
  'loading-player': 70,
  ready:           100,
  error:           100,
};

const STAGE_TEXT: Record<string, string> = {
  init:            'Initializing Command Systems...',
  authenticating:  'Authenticating Commander Identity...',
  'loading-player': 'Loading Strategic Assets...',
  ready:           'Command Center Online',
  error:           'Authentication Failed',
};

export default function App() {
  const { isAuthenticated, authStage, authError, user, player, retry } = useAuth();
  const [isLoading, setIsLoading]   = useState(true);
  const [progress,  setProgress]    = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);

  const commanderName = user?.firstName || 'Commander';

  // Sync progress to real auth stage
  useEffect(() => {
    const target = STAGE_PROGRESS[authStage] || 0;
    setProgress(target);
  }, [authStage]);

  // Smooth progress animation — never jumps backwards
  useEffect(() => {
    if (displayProgress >= progress) return;
    const step = setInterval(() => {
      setDisplayProgress(prev => {
        const next = Math.min(prev + 1, progress);
        if (next >= progress) clearInterval(step);
        return next;
      });
    }, 16);
    return () => clearInterval(step);
  }, [progress, displayProgress]);

  // Hide loading screen when auth is done
  useEffect(() => {
    if (authStage === 'ready' && displayProgress >= 100) {
      const timer = setTimeout(() => setIsLoading(false), 400);
      return () => clearTimeout(timer);
    }
  }, [authStage, displayProgress]);

  // Loading screen
  if (isLoading) {
    return (
      <VideoLoadingScreen
        progress={displayProgress}
        loadingText={STAGE_TEXT[authStage] || 'Loading...'}
        commanderName={commanderName}
        onComplete={() => {
          if (authStage === 'ready') setIsLoading(false);
        }}
      />
    );
  }

  // Auth error screen
  if (authStage === 'error') {
    return (
      <div style={{
        minHeight:      '100vh',
        background:     '#0a0f14',
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'center',
        alignItems:     'center',
        color:          '#cc0000',
        fontFamily:     'monospace',
        padding:        '20px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ letterSpacing: '3px', marginBottom: '12px', fontSize: '16px' }}>
            ⚠️ AUTHENTICATION FAILED
          </h2>
          <p style={{ fontSize: '12px', color: '#8892a4', marginBottom: '24px', maxWidth: '280px' }}>
            {authError || 'Unable to authenticate. Open this app through Telegram.'}
          </p>
          <button
            onClick={retry}
            style={{
              padding:       '12px 28px',
              background:    '#8B0000',
              color:         '#fff',
              border:        'none',
              borderRadius:  '4px',
              cursor:        'pointer',
              letterSpacing: '2px',
              fontWeight:    'bold',
              fontSize:      '12px',
            }}
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  // Main dashboard (post-auth)
  return (
    <div className="min-h-screen bg-[#0a0f14] text-white font-sans">
      <header style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        padding:        '16px',
        borderBottom:   '1px solid rgba(139,0,0,0.5)',
      }}>
        <h1 style={{
          fontSize:      '18px',
          fontWeight:    900,
          letterSpacing: '3px',
          color:         '#cc0000',
          textShadow:    '0 0 8px rgba(220,38,38,0.5)',
          margin:        0,
        }}>
          WORLD DOMINION
        </h1>
        <div style={{
          fontSize:      '11px',
          fontWeight:    'bold',
          letterSpacing: '2px',
          background:    'rgba(139,0,0,0.2)',
          padding:       '6px 12px',
          borderRadius:  '4px',
          border:        '1px solid rgba(139,0,0,0.4)',
          color:         '#e8e8e8',
        }}>
          CMD: {commanderName.toUpperCase()}
        </div>
      </header>

      <main style={{ padding: '16px', paddingBottom: '80px' }}>
        <div style={{
          border:        '1px solid rgba(139,0,0,0.3)',
          background:    'rgba(0,0,0,0.6)',
          padding:       '24px',
          borderRadius:  '12px',
          textAlign:     'center',
          marginTop:     '40px',
        }}>
          <h2 style={{ color: '#e8e8e8', letterSpacing: '2px', marginBottom: '8px' }}>
            COMMAND CENTER ACTIVE
          </h2>
          <p style={{ color: 'rgba(204,0,0,0.8)', fontSize: '13px' }}>
            {player?.currentNation
              ? `Nation: ${player.currentNation} · Role: ${player.role || 'Civilian'}`
              : 'No nation assigned — apply for a role to begin'}
          </p>
        </div>
      </main>
    </div>
  );
}
