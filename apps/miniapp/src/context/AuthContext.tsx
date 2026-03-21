import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  player: any | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, code: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    const res = await fetch('https://world-dominion.fly.dev/api/auth/email-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    setUser(data.user);
    setPlayer(data.player);
    setToken(data.token);
  };

  const verifyOtp = async (email: string, code: string, password: string, firstName?: string, lastName?: string) => {
    const res = await fetch('https://world-dominion.fly.dev/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, password, firstName, lastName }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    setUser(data.user);
    setPlayer(data.player);
    setToken(data.token);
  };

  const logout = () => {
    setUser(null);
    setPlayer(null);
    setToken(null);
  };

  useEffect(() => {
    // No persistent token – just set loading false
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, player, token, loading, login, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
