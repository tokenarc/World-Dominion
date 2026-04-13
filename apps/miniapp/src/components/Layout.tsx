'use client';

import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#050810',
    }}>
      {children}
    </div>
  );
}