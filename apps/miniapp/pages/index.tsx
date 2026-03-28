import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../src/context/AuthContext';
import { VideoLoadingScreen } from '../src/components/VideoLoadingScreen';

// Auth stage → real progress %
const STAGE_PROGRESS: Record<string, number> = {
  init:             5,
  authenticating:  35,
  'loading-player': 70,
  ready:           100,
  error:           100,
};

const STAGE_TEXT: Record<string, string> = {
  init:             'Initializing Command Systems...',
  authenticating:   'Authenticating Commander Identity...',
  'loading-player': 'Loading Strategic Assets...',
  ready:            'Command Center Online',
  error:            'Authentication Failed',
};

export default function IndexPage() {
  const router = useRouter();
  const { authStage, authError, isAuthenticated, user, retry } = useAuth();
  const [displayProgress, setDisplayProgress] = useState(0);
  const [showLoading, setShowLoading]         = useState(true);

  const targetProgress = STAGE_PROGRESS[authStage] || 0;
  const commanderName  = user?.firstName || 'Commander';

  // Smooth progress — never jumps backward
  useEffect(() => {
    if (displayProgress >= targetProgress) return;
    const step = setInterval(() => {
      setDisplayProgress(prev => {
        const next = Math.min(prev + 1.5, targetProgress);
        if (next >= targetProgress) clearInterval(step);
        return next;
      });
    }, 16);
    return () => clearInterval(step);
  }, [targetProgress]);

  // Navigate to dashboard when auth completes
  useEffect(() => {
    if (authStage === 'ready' && displayProgress >= 100) {
      const timer = setTimeout(() => {
        setShowLoading(false);
        router.replace('/dashboard');
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [authStage, displayProgress, router]);

  // Error screen
  if (authStage === 'error' && !showLoading) {
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
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ letterSpacing: '3px', marginBottom: '12px', fontSize: '14px' }}>
            AUTHENTICATION FAILED
          </h2>
          <p style={{ fontSize: '12px', color: '#8892a4', marginBottom: '24px', maxWidth: '280px', lineHeight: '1.6' }}>
            {authError || 'Unable to authenticate. Open this app through Telegram.'}
          </p>
          <button
            onClick={retry}
            style={{
              padding:       '12px 32px',
              background:    'linear-gradient(135deg, #cc0000, #8B0000)',
              color:         '#fff',
              border:        'none',
              borderRadius:  '6px',
              cursor:        'pointer',
              letterSpacing: '2px',
              fontWeight:    'bold',
              fontSize:      '12px',
              boxShadow:     '0 0 20px rgba(204,0,0,0.4)',
            }}
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  // Loading screen (always shown until auth completes)
  return (
    <VideoLoadingScreen
      progress={displayProgress}
      loadingText={STAGE_TEXT[authStage] || 'Loading...'}
      commanderName={commanderName}
      onComplete={() => {
        if (authStage === 'ready') {
          setShowLoading(false);
          router.replace('/dashboard');
        }
      }}
    />
  );
}
