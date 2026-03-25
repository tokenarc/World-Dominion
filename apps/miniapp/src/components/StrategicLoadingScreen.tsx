import { useState, useEffect } from 'react';

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

const getProgress = (stages: LoadingStage[]): number => {
  const completed = stages.filter(s => s.status === 'complete').length;
  const loading = stages.find(s => s.status === 'loading') ? 0.5 : 0;
  return Math.round(((completed + loading) / stages.length) * 100);
};

export default function StrategicLoadingScreen() {
  const [stages, setStages] = useState<LoadingStage[]>(STAGES);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(getProgress(stages));
    }, 100);
    return () => clearInterval(timer);
  }, [stages]);

  const updateStage = (index: number, status: LoadingStage['status']) => {
    setStages(prev => prev.map((s, i) => i === index ? { ...s, status } : s));
  };

  // Simulate progress for demo (in real app, this will be driven by actual auth flow)
  useEffect(() => {
    let stageIdx = 0;
    const interval = setInterval(() => {
      if (stageIdx < STAGES.length - 1) {
        updateStage(stageIdx, 'complete');
        stageIdx++;
        updateStage(stageIdx, 'loading');
        if (stageIdx === STAGES.length - 1) {
          clearInterval(interval);
        }
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

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
          <div style={{ ...progressBarFillStyle, width: `${progress}%` }}></div>
        </div>

        {stages.map((stage, idx) => (
          <div key={idx} style={stageContainerStyle}>
            <div style={stageNameStyle(stage.status)}>
              <div style={stageIndicatorStyle(stage.status)}></div>
              {stage.name}
            </div>
            <div style={stageBarStyle}>
              <div style={{ ...stageBarFillStyle(stage.status), width: stage.status === 'complete' ? '100%' : stage.status === 'loading' ? '60%' : '0%' }}></div>
            </div>
          </div>
        ))}

        <div style={footerStyle}>
          <div style={{ marginBottom: '8px' }}>™ ESTABLISHING SECURE CONNECTION</div>
          <div style={{ opacity: 0.6 }}>"{quote}"</div>
        </div>
      </div>
    </div>
  );
}
