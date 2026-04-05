import React from 'react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a0f14',
      paddingBottom: '80px'
    }}>
      {children}
    </div>
  );
}
