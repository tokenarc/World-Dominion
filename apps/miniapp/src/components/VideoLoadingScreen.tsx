import { useEffect, useRef, useState } from 'react';

interface Props {
  progress: number;
  loadingText: string;
  commanderName?: string;
  onComplete?: () => void;
}

const LOADING_STAGES = [
  { threshold: 0,  text: 'Initializing Command Systems...' },
  { threshold: 20, text: 'Authenticating Commander Identity...' },
  { threshold: 50, text: 'Loading Strategic Assets...' },
  { threshold: 75, text: 'Establishing Secure Connection...' },
  { threshold: 90, text: 'Command Center Online' },
];

export const VideoLoadingScreen = ({ progress, loadingText, commanderName = 'Commander', onComplete }: Props) => {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [fadeOut,    setFadeOut]    = useState(false);

  // Scrub video to match auth progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoReady) return;
    const targetTime = (progress / 100) * video.duration;
    if (!isNaN(targetTime)) {
      video.currentTime = targetTime;
    }
  }, [progress, videoReady]);

  // Trigger fade + complete when done
  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => setFadeOut(true), 200);
      setTimeout(() => onComplete?.(), 600);
    }
  }, [progress, onComplete]);

  const totalSegments  = 20;
  const activeSegments = Math.floor((progress / 100) * totalSegments);

  return (
    <div style={{
      position:        'fixed',
      inset:           0,
      zIndex:          1000,
      backgroundColor: '#000',
      opacity:         fadeOut ? 0 : 1,
      transition:      'opacity 0.4s ease',
    }}>
      {/* Video background */}
      <video
        ref={videoRef}
        src="/loading.mp4"
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={() => setVideoReady(true)}
        style={{
          position:   'absolute',
          inset:      0,
          width:      '100%',
          height:     '100%',
          objectFit:  'cover',
        }}
      />

      {/* Dark overlay for text readability */}
      <div style={{
        position:   'absolute',
        inset:      0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.7) 75%, rgba(0,0,0,0.95) 100%)',
      }} />

      {/* Top — title */}
      <div style={{
        position:   'absolute',
        top:        '48px',
        left:       0,
        right:      0,
        textAlign:  'center',
        padding:    '0 20px',
      }}>
        <div style={{
          fontSize:      '28px',
          fontWeight:    900,
          letterSpacing: '6px',
          color:         '#fff',
          textShadow:    '0 0 20px rgba(204,0,0,0.8), 0 2px 4px rgba(0,0,0,0.8)',
          fontFamily:    'monospace',
        }}>
          WORLD DOMINION
        </div>
        <div style={{
          fontSize:      '10px',
          letterSpacing: '4px',
          color:         'rgba(255,215,0,0.8)',
          marginTop:     '4px',
          textShadow:    '0 0 10px rgba(255,215,0,0.5)',
        }}>
          GLOBAL COMMAND SIMULATION
        </div>
      </div>

      {/* Bottom — progress UI */}
      <div style={{
        position:   'absolute',
        bottom:     0,
        left:       0,
        right:      0,
        padding:    '0 20px 40px',
      }}>
        {/* Loading text */}
        <div style={{
          fontSize:      '11px',
          color:         'rgba(200,204,212,0.9)',
          letterSpacing: '2px',
          marginBottom:  '12px',
          textAlign:     'center',
          textShadow:    '0 1px 4px rgba(0,0,0,0.8)',
          minHeight:     '16px',
          transition:    'opacity 0.3s',
        }}>
          {loadingText}
        </div>

        {/* Segmented progress bar */}
        <div style={{
          display:         'flex',
          gap:             '2px',
          padding:         '4px',
          background:      'rgba(0,0,0,0.6)',
          border:          '1px solid rgba(139,0,0,0.5)',
          borderRadius:    '4px',
          marginBottom:    '12px',
          boxShadow:       '0 0 15px rgba(139,0,0,0.2)',
        }}>
          {Array.from({ length: totalSegments }).map((_, i) => (
            <div
              key={i}
              style={{
                flex:         1,
                height:       '6px',
                borderRadius: '1px',
                background:   i < activeSegments
                  ? 'linear-gradient(to top, #8B0000, #ff4444)'
                  : 'rgba(139,0,0,0.15)',
                boxShadow:    i < activeSegments
                  ? '0 0 6px rgba(255,68,68,0.6)'
                  : 'none',
                transition:   'all 0.15s',
              }}
            />
          ))}
        </div>

        {/* Status line */}
        <div style={{
          display:    'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(136,146,164,0.8)', letterSpacing: '1px', lineHeight: '1.6' }}>
            <div>SYS: <span style={{ color: '#00ff88' }}>ONLINE</span></div>
            <div>CMD: <span style={{ color: '#e8e8e8' }}>{commanderName.toUpperCase()}</span></div>
          </div>
          <div style={{
            fontFamily:    'monospace',
            fontSize:      '20px',
            fontWeight:    'bold',
            color:         '#FFD700',
            textShadow:    '0 0 10px rgba(255,215,0,0.5)',
            letterSpacing: '1px',
          }}>
            {Math.floor(progress)}%
          </div>
        </div>
      </div>
    </div>
  );
};
