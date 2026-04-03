import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../src/context/AuthContext';
import { VideoLoadingScreen } from '../src/components/VideoLoadingScreen';

const STAGE_PROGRESS: Record<string, number> = {
  init: 5, authenticating: 35, 'loading-player': 70, ready: 100, error: 100,
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
  const { authStage, authError, retry, user } = useAuth();
  const [displayProgress, setDisplayProgress] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'error' | 'done'>('loading');
  const navigated = useRef(false);
  const commanderName = user?.firstName || 'Commander';
  const targetProgress = STAGE_PROGRESS[authStage] || 0;

  // Smooth progress animation
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

  // Navigate when ready
  useEffect(() => {
    if (authStage === 'ready' && displayProgress >= 100 && !navigated.current) {
      navigated.current = true;
      setTimeout(() => { setPhase('done'); router.replace('/dashboard'); }, 400);
    }
  }, [authStage, displayProgress, router]);

  // Show error only after progress animation finishes
  useEffect(() => {
    if (authStage === 'error' && displayProgress >= 100) setPhase('error');
  }, [authStage, displayProgress]);

  if (phase === 'error') {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0f14', display: 'flex',
        flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        color: '#cc0000', fontFamily: 'monospace', padding: '20px',
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
              padding: '12px 32px', background: 'linear-gradient(135deg, #cc0000, #8B0000)',
              color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
              letterSpacing: '2px', fontWeight: 'bold', fontSize: '12px',
              boxShadow: '0 0 20px rgba(204,0,0,0.4)',
            }}
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <VideoLoadingScreen
      progress={displayProgress}
      loadingText={STAGE_TEXT[authStage] || 'Loading...'}
      commanderName={commanderName}
      onComplete={() => {
        if (authStage === 'ready' && !navigated.current) {
          navigated.current = true;
          setPhase('done');
          router.replace('/dashboard');
        }
      }}
    />
  );
}
