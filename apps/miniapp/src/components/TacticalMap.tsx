'use client';

import { useEffect, useState } from 'react';

interface TacticalMapProps {
  nationIso?: string;
  hasNation?: boolean;
}

export default function TacticalMap({ nationIso, hasNation }: TacticalMapProps) {
  const [scanY, setScanY] = useState(-100);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanY(Math.random() * 100);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      height: '200px',
      background: '#050d1a',
      border: '1px solid rgba(204, 0, 0, 0.4)',
      borderRadius: '12px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '10px',
        fontSize: '7px',
        color: '#FFD700',
        fontFamily: 'Orbitron, sans-serif',
        letterSpacing: '2px',
      }}>
        TERRA DOMINION TACTICAL MAP
      </div>

      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        fontSize: '9px',
        color: '#8892a4',
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        12.34°N 56.78°W
      </div>

      <svg
        viewBox="0 0 400 200"
        style={{
          width: '100%',
          height: '100%',
          opacity: 0.6,
        }}
      >
        <rect fill="#050d1a" width="400" height="200" />
        
        <path
          d="M80,40 Q120,30 160,45 T200,60 T280,50 T320,70"
          fill="none"
          stroke="#1a2810"
          strokeWidth="8"
        />
        <path
          d="M40,80 Q80,70 140,90 T220,100 T340,90"
          fill="none"
          stroke="#1a2810"
          strokeWidth="12"
        />
        <path
          d="M60,120 Q120,110 180,130 T260,140 T380,130"
          fill="none"
          stroke="#1a2810"
          strokeWidth="10"
        />
        <path
          d="M20,150 Q80,140 140,160 T220,170 T360,160"
          fill="none"
          stroke="#1a2810"
          strokeWidth="8"
        />
        
        {hasNation && (
          <circle
            cx={200 + Math.sin(Date.now() / 1000) * 20}
            cy={100 + Math.cos(Date.now() / 1000) * 15}
            r="6"
            fill="#cc0000"
            opacity="0.8"
          >
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>

      <div style={{
        position: 'absolute',
        inset: '10px',
        borderLeft: '2px solid rgba(204, 0, 0, 0.5)',
        borderRight: '2px solid rgba(204, 0, 0, 0.5)',
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute',
          top: '0',
          left: '-2px',
          width: '4px',
          height: '8px',
          background: '#cc0000',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '-2px',
          width: '4px',
          height: '8px',
          background: '#cc0000',
        }} />
        <div style={{
          position: 'absolute',
          top: '0',
          right: '-2px',
          width: '4px',
          height: '8px',
          background: '#cc0000',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '0',
          right: '-2px',
          width: '4px',
          height: '8px',
          background: '#cc0000',
        }} />
      </div>

      <div style={{
        position: 'absolute',
        top: `${scanY}%`,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(204,0,0,0.4), transparent)',
        animation: 'scan 3s linear infinite',
      }} />

      {!hasNation && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(5, 8, 16, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}>
          <div style={{
            border: '2px solid #cc0000',
            borderRadius: '8px',
            padding: '12px 20px',
            animation: 'glow 2s ease-in-out infinite',
          }}>
            <div style={{
              fontSize: '12px',
              color: '#cc0000',
              fontFamily: 'Orbitron, sans-serif',
              letterSpacing: '2px',
            }}>
              SELECT YOUR NATION
            </div>
          </div>
          <div style={{ fontSize: '10px', color: '#8892a4' }}>→ Navigate to Nations tab</div>
        </div>
      )}
    </div>
  );
}