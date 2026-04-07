import React, { useState, useEffect, useRef } from 'react';

interface VideoLoadingScreenProps {
  progress: number;
  loadingText: string;
  commanderName: string;
  onComplete?: () => void;
}

const TIPS = [
  "Tip: Build your economy before declaring war!",
  "Tip: Allies can help defend your nation.",
  "Tip: Command Points are earned through strategic victories.",
  "Tip: Market prices change every 6 hours.",
  "Tip: Spy missions can reveal enemy weaknesses.",
  "Tip: Join a faction for collective protection.",
  "Tip: Balance your military and economy.",
  "Tip: Nations with higher stability attract more trade.",
];

export function VideoLoadingScreen({ progress, loadingText, commanderName, onComplete }: VideoLoadingScreenProps) {
  const [tip, setTip] = useState(TIPS[Math.floor(Math.random() * TIPS.length)]);
  const [glowPhase, setGlowPhase] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlowPhase((p) => (p + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const time = Date.now() / 1000;
      
      for (let i = 0; i < 3; i++) {
        const offset = i * (Math.PI * 2) / 3;
        const x = canvas.width / 2 + Math.sin(time + offset) * 30;
        const y = canvas.height / 2 + Math.cos(time * 1.5 + offset) * 20;
        const radius = 4 + Math.sin(time * 2 + i) * 2;
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(204, 0, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(204, 0, 0, 0)');
        
        ctx.beginPath();
        ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  React.useEffect(() => {
    if (progress >= 100 && onComplete) {
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  const isStuck = progress < 100 && loadingText === 'Initializing Command Systems...';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f14 0%, #1a1f2a 50%, #0a0f14 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#FFD700',
      fontFamily: "'Courier New', monospace",
      position: 'relative',
      overflow: 'hidden',
    }}>
      <canvas
        ref={canvasRef}
        width={300}
        height={200}
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: 0.3,
          pointerEvents: 'none',
        }}
      />
      
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at 50% 30%, rgba(204, 0, 0, ${0.1 + Math.sin(glowPhase * Math.PI / 180) * 0.05}), transparent 50%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        padding: '0 20px',
      }}>
        <div style={{
          fontSize: '28px',
          fontWeight: 900,
          letterSpacing: '6px',
          marginBottom: '40px',
          color: '#cc0000',
          textShadow: `0 0 ${20 + Math.sin(glowPhase * Math.PI / 180) * 10}px rgba(220,0,0,0.8), 0 0 40px rgba(255,215,0,0.3)`,
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          WORLD DOMINION
        </div>

        <div style={{
          width: '280px',
          height: '6px',
          background: 'rgba(139, 0, 0, 0.2)',
          borderRadius: '3px',
          overflow: 'hidden',
          margin: '0 auto 30px',
          boxShadow: '0 0 20px rgba(0,0,0,0.5), inset 0 1px 3px rgba(0,0,0,0.3)',
          position: 'relative',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #8B0000, #cc0000, #FFD700)',
            transition: 'width 0.3s ease-out',
            boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
            borderRadius: '3px',
          }} />
        </div>

        <div style={{
          fontSize: '13px',
          letterSpacing: '3px',
          color: '#8892a4',
          marginBottom: '20px',
          minHeight: '20px',
        }}>
          {loadingText}
        </div>

        <div style={{
          fontSize: '11px',
          letterSpacing: '2px',
          color: '#556677',
          marginBottom: '30px',
        }}>
          {Math.round(progress)}%
        </div>

        {commanderName && (
          <div style={{
            fontSize: '11px',
            letterSpacing: '4px',
            color: '#667788',
            marginTop: '20px',
            padding: '10px 20px',
            border: '1px solid rgba(139, 0, 0, 0.3)',
            borderRadius: '4px',
            background: 'rgba(0,0,0,0.3)',
          }}>
            COMMANDER: {commanderName.toUpperCase()}
          </div>
        )}

        {isStuck && (
          <div style={{
            marginTop: '30px',
            color: '#cc0000',
            fontSize: '11px',
            animation: 'blink 1s infinite',
          }}>
            ⚠ System initializing...
          </div>
        )}

        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '0',
          right: '0',
          textAlign: 'center',
          fontSize: '10px',
          color: '#445566',
          letterSpacing: '1px',
          maxWidth: '300px',
          margin: '0 auto',
        }}>
          {tip}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}