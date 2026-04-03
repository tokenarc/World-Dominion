import { useEffect, useRef, useState } from 'react';

interface Props {
  progress: number;
  loadingText: string;
  commanderName?: string;
  onComplete?: () => void;
}

export const VideoLoadingScreen = ({ progress, loadingText, commanderName = 'Commander', onComplete }: Props) => {
  const [dots, setDots]       = useState('');
  const completedRef          = useRef(false);
  const pct                   = Math.min(Math.floor(progress), 100);
  const totalSegs             = 24;
  const activeSeg             = Math.floor((progress / 100) * totalSegs);

  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (progress < 100 || completedRef.current) return;
    completedRef.current = true;
    setTimeout(() => onComplete?.(), 600);
  }, [progress, onComplete]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'radial-gradient(ellipse at center, #0d1117 0%, #050810 60%, #000 100%)',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', overflow: 'hidden',
    }}>

      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
      }} />

      {/* Red glow top */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '60%', height: '2px',
        background: 'linear-gradient(90deg, transparent, #cc0000, transparent)',
        boxShadow: '0 0 40px 8px rgba(204,0,0,0.3)',
      }} />

      {/* TOP: Title */}
      <div style={{ position: 'relative', textAlign: 'center', padding: '52px 24px 0' }}>
        <div style={{ position: 'absolute', top: '44px', left: '24px', width: '20px', height: '20px', borderTop: '2px solid #cc0000', borderLeft: '2px solid #cc0000', opacity: 0.7 }} />
        <div style={{ position: 'absolute', top: '44px', right: '24px', width: '20px', height: '20px', borderTop: '2px solid #cc0000', borderRight: '2px solid #cc0000', opacity: 0.7 }} />
        <div style={{
          fontSize: '30px', fontWeight: 900, letterSpacing: '7px', color: '#fff',
          textShadow: '0 0 30px rgba(204,0,0,0.9), 0 0 60px rgba(204,0,0,0.4)',
          fontFamily: '"Arial Black", monospace', lineHeight: 1,
        }}>
          WORLD DOMINION
        </div>
        <div style={{
          fontSize: '9px', letterSpacing: '5px', color: 'rgba(255,215,0,0.85)',
          marginTop: '6px', textShadow: '0 0 12px rgba(255,215,0,0.6)',
        }}>
          GLOBAL COMMAND SIMULATION
        </div>
      </div>

      {/* MIDDLE: Animated globe/grid */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <div style={{ position: 'relative', width: '180px', height: '180px' }}>
          {/* Outer ring */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '1px solid rgba(204,0,0,0.3)',
            boxShadow: '0 0 30px rgba(204,0,0,0.15), inset 0 0 30px rgba(204,0,0,0.05)',
          }} />
          {/* Spinning ring */}
          <div style={{
            position: 'absolute', inset: '10px', borderRadius: '50%',
            border: '1px solid transparent',
            borderTop: '2px solid #cc0000',
            borderRight: '1px solid rgba(204,0,0,0.4)',
            animation: 'spin 2s linear infinite',
          }} />
          {/* Counter spin */}
          <div style={{
            position: 'absolute', inset: '25px', borderRadius: '50%',
            border: '1px solid transparent',
            borderBottom: '2px solid rgba(255,215,0,0.6)',
            borderLeft: '1px solid rgba(255,215,0,0.2)',
            animation: 'spin 3s linear infinite reverse',
          }} />
          {/* Inner glow */}
          <div style={{
            position: 'absolute', inset: '45px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(204,0,0,0.15) 0%, transparent 70%)',
            border: '1px solid rgba(204,0,0,0.2)',
          }} />
          {/* Center dot */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#cc0000',
            boxShadow: '0 0 12px rgba(204,0,0,0.8)',
          }} />
          {/* Grid lines horizontal */}
          {[-30, 0, 30].map(y => (
            <div key={y} style={{
              position: 'absolute', left: '15%', right: '15%',
              top: `calc(50% + ${y}px)`, height: '1px',
              background: 'rgba(204,0,0,0.12)',
            }} />
          ))}
          {/* Grid lines vertical */}
          {[-30, 0, 30].map(x => (
            <div key={x} style={{
              position: 'absolute', top: '15%', bottom: '15%',
              left: `calc(50% + ${x}px)`, width: '1px',
              background: 'rgba(204,0,0,0.12)',
            }} />
          ))}
        </div>
      </div>

      {/* BOTTOM: HUD */}
      <div style={{ padding: '0 20px 44px', position: 'relative' }}>
        <div style={{
          textAlign: 'center', fontSize: '11px', color: 'rgba(200,204,212,0.9)',
          letterSpacing: '2px', marginBottom: '14px',
          minHeight: '16px', fontFamily: 'monospace',
        }}>
          {loadingText}{dots}
        </div>

        {/* Segmented bar */}
        <div style={{
          display: 'flex', gap: '2px', marginBottom: '10px', padding: '5px',
          background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(139,0,0,0.6)',
          borderRadius: '4px', boxShadow: '0 0 20px rgba(139,0,0,0.25), inset 0 0 10px rgba(0,0,0,0.5)',
        }}>
          {Array.from({ length: totalSegs }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: '7px', borderRadius: '1px',
              background: i < activeSeg
                ? i < activeSeg - 2
                  ? 'linear-gradient(to top, #6b0000, #cc2200)'
                  : 'linear-gradient(to top, #cc0000, #ff5533)'
                : 'rgba(139,0,0,0.12)',
              boxShadow: i < activeSeg ? '0 0 8px rgba(204,0,0,0.7)' : 'none',
              transition: 'all 0.1s',
            }} />
          ))}
        </div>

        {/* Status row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', lineHeight: '1.8', color: 'rgba(136,146,164,0.8)' }}>
            <div><span style={{ color: '#444', marginRight: '6px' }}>SYS</span><span style={{ color: '#00ff88' }}>● ONLINE</span></div>
            <div><span style={{ color: '#444', marginRight: '6px' }}>TG</span><span style={{ color: pct >= 35 ? '#00ff88' : '#cc0000' }}>{pct >= 35 ? '● AUTH OK' : '● VERIFYING'}</span></div>
            <div><span style={{ color: '#444', marginRight: '6px' }}>CMD</span><span style={{ color: '#e8e8e8' }}>{commanderName.toUpperCase()}</span></div>
          </div>
          <div style={{
            fontFamily: 'monospace', fontSize: '36px', fontWeight: 'bold',
            color: pct >= 100 ? '#00ff88' : '#FFD700',
            textShadow: pct >= 100 ? '0 0 20px rgba(0,255,136,0.6)' : '0 0 20px rgba(255,215,0,0.5)',
            lineHeight: 1, letterSpacing: '-1px',
          }}>
            {pct}<span style={{ fontSize: '14px', letterSpacing: '1px', opacity: 0.7 }}>%</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
