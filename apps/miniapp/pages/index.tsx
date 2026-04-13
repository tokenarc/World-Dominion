import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useApp } from '../src/context/AppContext';

const LOADING_TIPS = [
  "Tip: Build your economy before declaring war!",
  "Tip: Allies can help defend your nation.",
  "Tip: Command Points are earned through victories.",
  "Tip: Market prices change every 6 hours.",
  "Tip: Balance military and economy.",
];

function IndexPage() {
  const router = useRouter();
  const { appState, error } = useApp();
  const [progress, setProgress] = useState(0);
  const [tip] = useState(() => LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)]);
  const navigated = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 2, 95));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (appState === 'ready' && !navigated.current) {
      navigated.current = true;
      setProgress(100);
      setTimeout(() => router.replace('/dashboard'), 500);
    }
  }, [state, router]);

  if (appState === 'error') {
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
        <div style={{ fontSize: '32px', marginBottom: '20px' }}>⚠️</div>
        <h2 style={{ letterSpacing: '3px', marginBottom: '12px', fontSize: '14px' }}>
          AUTHENTICATION FAILED
        </h2>
        <p style={{ fontSize: '12px', color: '#667788', marginBottom: '24px', maxWidth: '280px', textAlign: 'center' }}>
          {error || 'Open through Telegram bot.'}
        </p>
        <button 
          onClick={() => { localStorage.removeItem('wd_token'); window.location.reload(); }}
          style={{
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #cc0000, #8B0000)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            letterSpacing: '2px',
            fontWeight: 'bold',
            fontSize: '12px',
          }}>
          RETRY
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #050810 0%, #0a0f18 50%, #050810 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#FFD700',
      fontFamily: 'monospace',
    }}>
      <div style={{
        fontSize: '24px',
        fontWeight: 900,
        letterSpacing: '6px',
        marginBottom: '40px',
        color: '#cc0000',
        textShadow: '0 0 20px rgba(220,0,0,0.8)',
      }}>
        WORLD DOMINION
      </div>

      <div style={{
        width: '260px',
        height: '4px',
        background: 'rgba(139, 0, 0, 0.2)',
        borderRadius: '2px',
        overflow: 'hidden',
        marginBottom: '20px',
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #8B0000, #cc0000, #FFD700)',
          transition: 'width 0.3s ease-out',
        }} />
      </div>

      <div style={{ fontSize: '11px', letterSpacing: '3px', color: '#667788', marginBottom: '16px' }}>
        {Math.round(progress)}%
      </div>

      <div style={{ fontSize: '10px', letterSpacing: '2px', color: '#445566' }}>
        {appState === 'booting' || appState === 'detecting' || appState === 'authenticating' ? 'Connecting to Telegram...' : 'Loading assets...'}
      </div>

      <div style={{ position: 'fixed', bottom: '30px', fontSize: '10px', color: '#334455' }}>
        {tip}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(IndexPage), { ssr: false });