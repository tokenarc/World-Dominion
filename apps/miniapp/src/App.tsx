import { useEffect, useState } from 'react';
import { VideoLoadingScreen } from './components/VideoLoadingScreen';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { state, error, user, player } = useAuth();
  const [progress, setProgress] = useState(0);

  const commanderName = user?.firstName || 'Commander';
  const isAuthenticated = state === 'ready';

  useEffect(() => {
    if (state === 'loading') setProgress(p => Math.min(p + 10, 70));
    else if (state === 'ready') setProgress(100);
    else if (state === 'error') setProgress(100);
  }, [state]);

  if (state === 'error') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#050810',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#cc0000',
        fontFamily: 'monospace',
        padding: '20px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ letterSpacing: '3px', marginBottom: '12px', fontSize: '16px' }}>
            AUTHENTICATION FAILED
          </h2>
          <p style={{ fontSize: '12px', color: '#667788', marginBottom: '24px' }}>
            {error || 'Open through Telegram bot.'}
          </p>
          <button
            onClick={() => { localStorage.removeItem('wd_token'); window.location.reload(); }}
            style={{ padding: '12px 28px', background: '#8B0000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', letterSpacing: '2px', fontWeight: 'bold', fontSize: '12px' }}>
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <VideoLoadingScreen
      progress={progress}
      loadingText={state === 'loading' ? 'Connecting to Telegram...' : 'Loading assets...'}
      commanderName={commanderName}
      onComplete={() => {}}
    />
  );
}