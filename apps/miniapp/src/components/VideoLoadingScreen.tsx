import { useEffect, useRef, useState } from 'react';

interface Props {
  progress: number;       // 0-100, driven by real auth stage
  loadingText: string;
  commanderName?: string;
  onComplete?: () => void;
}

export const VideoLoadingScreen = ({ progress, loadingText, commanderName = 'Commander', onComplete }: Props) => {
  const videoRef       = useRef<HTMLVideoElement>(null);
  const [ready,  setReady]  = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [dots,   setDots]   = useState('');

  // Animated dots for loading text
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(id);
  }, []);

  // Video loads — mark ready
  const handleMeta = () => setReady(true);

  // Scrub video position to match auth progress (controlled, not playing)
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !ready || isNaN(v.duration)) return;
    // Map progress 0-100 → 0 to video duration
    v.currentTime = (Math.min(progress, 99.9) / 100) * v.duration;
  }, [progress, ready]);

  // When 100% — fade out then call onComplete
  useEffect(() => {
    if (progress < 100) return;
    const v = videoRef.current;
    if (v && ready && !isNaN(v.duration)) v.currentTime = v.duration;
    const t1 = setTimeout(() => setFadeOut(true), 300);
    const t2 = setTimeout(() => onComplete?.(), 750);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [progress, ready, onComplete]);

  const totalSegs  = 24;
  const activeSeg  = Math.floor((progress / 100) * totalSegs);
  const pct        = Math.min(Math.floor(progress), 100);

  return (
    <div style={{
      position:   'fixed',
      inset:      0,
      zIndex:     9999,
      background: '#000',
      opacity:    fadeOut ? 0 : 1,
      transition: 'opacity 0.45s ease',
      overflow:   'hidden',
    }}>

      {/* ── Video background (scrubbed, not playing) ─────── */}
      <video
        ref={videoRef}
        src="/loading.mp4"
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={handleMeta}
        style={{
          position:  'absolute',
          inset:     0,
          width:     '100%',
          height:    '100%',
          objectFit: 'cover',
        }}
      />

      {/* ── Gradient overlay ─────────────────────────────── */}
      <div style={{
        position:   'absolute',
        inset:      0,
        background: `
          linear-gradient(to bottom,
            rgba(5,8,16,0.55) 0%,
            rgba(5,8,16,0.0)  30%,
            rgba(5,8,16,0.0)  55%,
            rgba(5,8,16,0.75) 75%,
            rgba(5,8,16,0.97) 100%
          )
        `,
      }} />

      {/* ── Scanline effect ───────────────────────────────── */}
      <div style={{
        position:           'absolute',
        inset:              0,
        backgroundImage:    'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        pointerEvents:      'none',
      }} />

      {/* ── TOP: Title ───────────────────────────────────── */}
      <div style={{
        position:  'absolute',
        top:       '52px',
        left:      0,
        right:     0,
        textAlign: 'center',
        padding:   '0 24px',
      }}>
        <div style={{
          fontSize:      '30px',
          fontWeight:    900,
          letterSpacing: '7px',
          color:         '#fff',
          textShadow:    '0 0 30px rgba(204,0,0,0.9), 0 0 60px rgba(204,0,0,0.4)',
          fontFamily:    '"Arial Black", monospace',
          lineHeight:    1,
        }}>
          WORLD DOMINION
        </div>
        <div style={{
          fontSize:      '9px',
          letterSpacing: '5px',
          color:         'rgba(255,215,0,0.85)',
          marginTop:     '6px',
          textShadow:    '0 0 12px rgba(255,215,0,0.6)',
        }}>
          GLOBAL COMMAND SIMULATION
        </div>

        {/* Corner decorations */}
        <div style={{ position: 'absolute', top: '-8px', left: '24px', width: '20px', height: '20px', borderTop: '2px solid #cc0000', borderLeft: '2px solid #cc0000', opacity: 0.7 }} />
        <div style={{ position: 'absolute', top: '-8px', right: '24px', width: '20px', height: '20px', borderTop: '2px solid #cc0000', borderRight: '2px solid #cc0000', opacity: 0.7 }} />
      </div>

      {/* ── BOTTOM: HUD ──────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        bottom:   0,
        left:     0,
        right:    0,
        padding:  '0 20px 44px',
      }}>

        {/* Loading text with animated dots */}
        <div style={{
          textAlign:     'center',
          fontSize:      '11px',
          color:         'rgba(200,204,212,0.9)',
          letterSpacing: '2px',
          marginBottom:  '14px',
          textShadow:    '0 1px 6px rgba(0,0,0,0.9)',
          minHeight:     '16px',
          fontFamily:    'monospace',
        }}>
          {loadingText}{dots}
        </div>

        {/* Segmented bar */}
        <div style={{
          display:       'flex',
          gap:           '2px',
          marginBottom:  '10px',
          padding:       '5px',
          background:    'rgba(0,0,0,0.7)',
          border:        '1px solid rgba(139,0,0,0.6)',
          borderRadius:  '4px',
          boxShadow:     '0 0 20px rgba(139,0,0,0.25), inset 0 0 10px rgba(0,0,0,0.5)',
        }}>
          {Array.from({ length: totalSegs }).map((_, i) => (
            <div key={i} style={{
              flex:         1,
              height:       '7px',
              borderRadius: '1px',
              background:   i < activeSeg
                ? i < activeSeg - 2
                  ? 'linear-gradient(to top, #6b0000, #cc2200)'
                  : 'linear-gradient(to top, #cc0000, #ff5533)'
                : 'rgba(139,0,0,0.12)',
              boxShadow:    i < activeSeg ? '0 0 8px rgba(204,0,0,0.7)' : 'none',
              transition:   'all 0.1s',
            }} />
          ))}
        </div>

        {/* Status row */}
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'flex-end',
        }}>
          {/* Left: system status */}
          <div style={{ fontFamily: 'monospace', fontSize: '9px', lineHeight: '1.8', color: 'rgba(136,146,164,0.8)' }}>
            <div>
              <span style={{ color: '#444', marginRight: '6px' }}>SYS</span>
              <span style={{ color: '#00ff88' }}>● ONLINE</span>
            </div>
            <div>
              <span style={{ color: '#444', marginRight: '6px' }}>TG</span>
              <span style={{ color: pct >= 35 ? '#00ff88' : '#cc0000' }}>
                {pct >= 35 ? '● AUTH OK' : '● VERIFYING'}
              </span>
            </div>
            <div>
              <span style={{ color: '#444', marginRight: '6px' }}>CMD</span>
              <span style={{ color: '#e8e8e8' }}>{commanderName.toUpperCase()}</span>
            </div>
          </div>

          {/* Right: percentage */}
          <div style={{
            fontFamily:    'monospace',
            fontSize:      '36px',
            fontWeight:    'bold',
            color:         pct >= 100 ? '#00ff88' : '#FFD700',
            textShadow:    pct >= 100
              ? '0 0 20px rgba(0,255,136,0.6)'
              : '0 0 20px rgba(255,215,0,0.5)',
            lineHeight:    1,
            letterSpacing: '-1px',
          }}>
            {pct}
            <span style={{ fontSize: '14px', letterSpacing: '1px', opacity: 0.7 }}>%</span>
          </div>
        </div>
      </div>

    </div>
  );
};
