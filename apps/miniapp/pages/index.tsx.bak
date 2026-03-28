import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import SplashLoading from '../src/components/SplashLoading';

export default function IndexPage() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const validateTelegramAuth = async () => {
      try {
        // Extract Telegram WebApp initData
        const initData = window.Telegram?.WebApp?.initData;

        if (!initData) {
          throw new Error('No Telegram initData found. Open this app through Telegram.');
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
          // Store minimal user data in memory/session
          sessionStorage.setItem('telegramUser', JSON.stringify(data.user));
          // Short delay to ensure splash is seen, then navigate
          setTimeout(() => router.push('/select-nation'), 500);
        } else {
          throw new Error('Telegram authentication failed.');
        }
      } catch (err: any) {
        setAuthError(err.message || 'Authentication error.');
      } finally {
        setShowSplash(false);
      }
    };

    // Small delay to ensure splash renders before validation
    const timer = setTimeout(validateTelegramAuth, 1000);
    return () => clearTimeout(timer);
  }, [router]);

  // Phase 1: Splash screen
  if (showSplash) {
    return <SplashLoading />;
  }

  // Phase 2: Error state
  if (authError) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#050810',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#ff4444',
        fontFamily: 'monospace',
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h2 style={{ marginBottom: '12px', letterSpacing: '2px' }}>AUTHENTICATION FAILED</h2>
          <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>{authError}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              background: '#8B0000',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              letterSpacing: '1px',
              fontWeight: 'bold',
            }}
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  // Phase 3: Authenticated - redirect to nation selection
  if (isAuthenticated) {
    // This will be brief; useEffect handles navigation
    return (
      <div style={{
        minHeight: '100vh',
        background: '#050810',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#FFD700',
        fontFamily: 'monospace',
      }}>
        <p>Redirecting to Command Center...</p>
      </div>
    );
  }

  // Fallback - should not reach here
  return null;
}
