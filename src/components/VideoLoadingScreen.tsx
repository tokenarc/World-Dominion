import { useEffect, useRef } from 'react';

interface Props {
  progress: number;
  loadingText: string;
  commanderName?: string;
  onComplete?: () => void;
}

export const VideoLoadingScreen = ({ progress, loadingText, commanderName, onComplete }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const setTime = () => {
      if (video.duration && !isNaN(video.duration)) {
        video.currentTime = (progress / 100) * video.duration;
      }
    };

    if (video.readyState >= 1) {
      setTime();
    } else {
      video.addEventListener('loadedmetadata', setTime);
      return () => video.removeEventListener('loadedmetadata', setTime);
    }
  }, [progress]);

  useEffect(() => {
    if (progress >= 100 && onComplete) {
      setTimeout(onComplete, 200);
    }
  }, [progress, onComplete]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'black' }}>
      <video
        ref={videoRef}
        src="/loading.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        left: 0,
        right: 0,
        textAlign: 'center',
        color: 'white',
        textShadow: '0 0 10px black',
        zIndex: 10,
      }}>
        <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{loadingText}</div>
        <progress value={progress} max={100} style={{ width: '70%', height: '8px', borderRadius: '4px' }} />
        {commanderName && <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Commander: {commanderName}</div>}
      </div>
    </div>
  );
};
