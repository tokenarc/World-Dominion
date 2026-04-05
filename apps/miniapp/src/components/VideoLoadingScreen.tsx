import React from 'react';

interface VideoLoadingScreenProps {
  progress: number;
  loadingText: string;
  commanderName: string;
  onComplete?: () => void;
}

export function VideoLoadingScreen({ progress, loadingText, commanderName, onComplete }: VideoLoadingScreenProps) {
  React.useEffect(() => {
    if (progress >= 100 && onComplete) {
      const timer = setTimeout(onComplete, 400);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0f14',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#FFD700',
      fontFamily: 'monospace',
    }}>
      <div style={{
        fontSize: '24px',
        fontWeight: 900,
        letterSpacing: '4px',
        marginBottom: '30px',
        color: '#cc0000',
        textShadow: '0 0 10px rgba(220,0,0,0.5)',
      }}>
        WORLD DOMINION
      </div>
      <div style={{
        width: '200px',
        height: '4px',
        background: 'rgba(139,0,0,0.3)',
        borderRadius: '2px',
        overflow: 'hidden',
        marginBottom: '20px',
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #8B0000, #FFD700)',
          transition: 'width 0.3s ease',
        }} />
      </div>
      <div style={{ fontSize: '12px', letterSpacing: '2px', color: '#8892a4' }}>
        {loadingText}
      </div>
      {commanderName && (
        <div style={{ 
          fontSize: '10px', 
          letterSpacing: '3px', 
          color: '#8892a4', 
          marginTop: '10px' 
        }}>
          COMMANDER: {commanderName.toUpperCase()}
        </div>
      )}
    </div>
  );
}
