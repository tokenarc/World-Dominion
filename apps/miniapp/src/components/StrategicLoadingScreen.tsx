import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoadingStage {
  name: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
}

const STAGES: LoadingStage[] = [
  { name: 'Authenticating...', status: 'pending' },
  { name: 'Fetching Player Data...', status: 'pending' },
  { name: 'Loading World Configuration...', status: 'pending' },
  { name: 'Deploying Forces...', status: 'pending' },
  { name: 'Ready for Command', status: 'pending' },
];

export default function StrategicLoadingScreen() {
  const { authStage } = useAuth();
  const [progressPercent, setProgressPercent] = useState(0);

  // Calculate progress percentage based on authStage
  useEffect(() => {
    switch (authStage) {
      case 'ready':
      case 'error':
        setProgressPercent(100);
        break;
      case 'authenticating':
        setProgressPercent(20);
        break;
      case 'loading-player':
        setProgressPercent(50);
        break;
      case 'loading-config':
        setProgressPercent(70);
        break;
      default:
        setProgressPercent(0);
    }
  }, [authStage]);

  // Compute stage statuses based on authStage
  const getStageStatus = (idx: number): 'pending' | 'loading' | 'complete' | 'error' => {
    const stageIndexMap: Record<string, number> = {
      'init': 0,
      'authenticating': 0,
      'loading-player': 1,
      'loading-config': 2,
      'ready': 4,
      'error': 3,
    };

    const currentIndex = stageIndexMap[authStage];
    if (currentIndex === undefined) return 'pending';

    if (idx < currentIndex) return 'complete';
    if (idx === currentIndex) {
      if (authStage === 'error' && idx === 3) return 'error';
      return authStage === 'ready' ? 'complete' : 'loading';
    }
    return 'pending';
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #050810 0%, #0a1428 50%, #050810 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: "'Cinzel', 'Times New Roman', serif",
    color: '#e8e8e8',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  };

  // Animated grid background
  const gridStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      linear-gradient(rgba(139, 0, 0, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(139, 0, 0, 0.1) 1px, transparent 1px)
    `,
    backgroundSize: '50px 50px',
    opacity: 0.3,
    animation: 'gridPulse 4s ease-in-out infinite',
  };

  const contentStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 1,
    maxWidth: '500px',
    width: '100%',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 'clamp(28px, 5vw, 48px)',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: '10px',
    letterSpacing: '4px',
    textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
    fontWeight: 'bold',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#8B0000',
    textAlign: 'center',
    marginBottom: '40px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  };

  const progressBarContainerStyle: React.CSSProperties = {
    width: '100%',
    height: '4px',
    background: 'rgba(139, 0, 0, 0.3)',
    borderRadius: '2px',
    marginBottom: '30px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 215, 0, 0.2)',
  };

  const progressBarFillStyle: React.CSSProperties = {
    height: '100%',
    background: 'linear-gradient(90deg, #8B0000, #FFD700)',
    transition: 'width 0.5s ease-out',
    boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
  };

  const stageContainerStyle: React.CSSProperties = {
    marginBottom: '12px',
  };

  const stageNameStyle = (status: LoadingStage['status']): React.CSSProperties => ({
    fontSize: '13px',
    color: status === 'complete' ? '#FFD700' : status === 'loading' ? '#fff' : '#666',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'color 0.3s',
  });

  const stageIndicatorStyle = (status: LoadingStage['status']): React.CSSProperties => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: status === 'complete' ? '#FFD700' : status === 'loading' ? '#fff' : '#333',
    boxShadow: status === 'loading' ? '0 0 8px #fff' : status === 'complete' ? '0 0 8px #FFD700' : 'none',
    transition: 'all 0.3s',
  });

  const stageBarStyle: React.CSSProperties = {
    width: '100%',
    height: '2px',
    background: 'rgba(139, 0, 0, 0.2)',
    borderRadius: '1px',
    overflow: 'hidden',
  };

  const stageBarFillStyle = (status: LoadingStage['status']): React.CSSProperties => ({
    height: '100%',
    background: status === 'complete' ? '#FFD700' : status === 'loading' ? '#fff' : 'transparent',
    transition: 'width 0.5s ease-out',
  });

  const footerStyle: React.CSSProperties = {
    marginTop: '40px',
    fontSize: '11px',
    color: '#444',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  };

  const strategicQuotes = [
    "The art of strategy is the art of making use of time and space.",
    "Every battle is won or lost before it is ever fought.",
    "Opportunities multiply as they are seized.",
    "In war, the way is to avoid what is strong and to strike at what is weak.",
    "He who controls the past controls the future. He who controls the present controls the past.",
  ];

  const [quote] = useState(strategicQuotes[Math.floor(Math.random() * strategicQuotes.length)]);

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes gridPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
      `}</style>
      <div style={gridStyle}></div>

      <div style={contentStyle}>
        <div style={titleStyle}>WORLD DOMINION</div>
        <div style={subtitleStyle}>Geopolitical Strategy Simulator</div>

        <div style={progressBarContainerStyle}>
          <div style={{ ...progressBarFillStyle, width: `${progressPercent}%` }}></div>
        </div>

        {STAGES.map((stage, idx) => (
          <div key={idx} style={stageContainerStyle}>
            <div style={stageNameStyle(getStageStatus(idx))}>
              <div style={stageIndicatorStyle(getStageStatus(idx))}></div>
              {stage.name}
            </div>
            <div style={stageBarStyle}>
              <div style={{ ...stageBarFillStyle(getStageStatus(idx)), width: getStageStatus(idx) === 'complete' ? '100%' : getStageStatus(idx) === 'loading' ? '60%' : '0%' }}></div>
            </div>
          )
        ))}

        <div style={footerStyle}>
          <div style={{ marginBottom: '8px' }}>™ ESTABLISHING SECURE CONNECTION</div>
          <div style={{ opacity: 0.6 }}>"{quote}"</div>
        </div>
      </div>
    </div>
  );
}