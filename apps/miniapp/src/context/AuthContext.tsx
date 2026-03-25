import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  telegramId?: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  player: any | null;
  token: string | null;
  loading: boolean;
  authStage: 'init' | 'authenticating' | 'loading-player' | 'loading-config' | 'ready' | 'error';
  telegramAuth: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        ready: () => void;
        close: () => void;
        expand: () => void;
      };
    };
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authStage, setAuthStage] = useState<'init' | 'authenticating' | 'loading-player' | 'loading-config' | 'ready' | 'error'>('init');
  const [error, setError] = useState<string | null>(null);

  const telegramAuth = async () => {
    setAuthStage('authenticating');
    setError(null);

    try {
      // Get Telegram WebApp initData
      const tg = window.Telegram?.WebApp;
      if (!tg || !tg.initData) {
        throw new Error('Not running in Telegram WebApp environment');
      }

      // Call backend to verify Telegram authentication
      const res = await fetch('https://world-dominion-bot.onrender.com/api/auth/telegram-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setUser(data.user);
      setPlayer(data.player);
      setToken(data.token);
      setAuthStage('loading-player');

      // Simulate loading stages (in real app, these would be actual data fetches)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAuthStage('loading-config');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAuthStage('ready');

      // Ready
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message);
      setAuthStage('error');
    }
  };

  const logout = () => {
    setUser(null);
    setPlayer(null);
    setToken(null);
    setAuthStage('init');
    setError(null);
  };

  // Auto-initiate auth on mount
  useEffect(() => {
    telegramAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, player, token, loading: authStage !== 'ready' && authStage !== 'error', authStage, telegramAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
