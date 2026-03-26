import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SplashLoading from './components/SplashLoading';
import NationSelection from './pages/NationSelection';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const validateTelegramAuth = async () => {
      try {
        // Extract Telegram WebApp initData
        const initData = window.Telegram?.WebApp?.initData;

        if (!initData) {
          throw new Error('No Telegram initData found. Access through Telegram Desktop.');
        }

        // Send to backend for validation
        const response = await fetch('https://world-dominion.onrender.com/api/auth/telegram/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ initData }),
        });

        const data = await response.json();

        if (data.valid && data.user) {
          setIsAuthenticated(true);
          setUserId(data.user.id);
          // Store minimal user data in memory
          localStorage.setItem('telegramUser', JSON.stringify(data.user));
        } else {
          throw new Error('Telegram authentication failed.');
        }
      } catch (err: any) {
        setAuthError(err.message || 'Authentication error.');
      } finally {
        setShowSplash(false);
      }
    };

    // Give splash a moment to render, then validate
    const timer = setTimeout(validateTelegramAuth, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Phase 1: Splash screen
  if (showSplash) {
    return <SplashLoading />;
  }

  // Phase 2: Authentication flow
  if (authError) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#050810',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#ff4444',
        fontFamily: 'Arial, sans-serif',
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h2 style={{ marginBottom: '12px' }}>Authentication Failed</h2>
          <p style={{ fontSize: '14px', color: '#888' }}>{authError}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 24px',
              background: '#8B0000',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Phase 3: Authenticated - show Nation Selection
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NationSelection />} />
        <Route path="/select-nation" element={<NationSelection />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
