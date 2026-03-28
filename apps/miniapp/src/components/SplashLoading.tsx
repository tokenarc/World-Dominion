import { useState, useEffect } from 'react';
import { VideoLoadingScreen } from './VideoLoadingScreen';

export default function SplashLoading() {
  const [progress, setProgress] = useState(0);
  const [loadingText] = useState('Initializing...');
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Simulate progress for the splash screen
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 5;
        if (next >= 100) {
          clearInterval(interval);
          setDone(true);
          return 100;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (done) return null;

  return (
    <VideoLoadingScreen
      progress={progress}
      loadingText={loadingText}
      onComplete={() => {}}
    />
  );
}
