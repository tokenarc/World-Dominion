import React, { useEffect, useState } from 'react';
import { VideoLoadingScreen } from "./components/VideoLoadingScreen";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('Commander');
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Verifying Nation Assets...');

  useEffect(() => {
    // 1. Real Telegram Native Authentication
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      if (tg.initDataUnsafe?.user?.first_name) {
        setUserName(tg.initDataUnsafe.user.first_name);
      }
    }

    // 2. Loading Screen Animation Logic (3.5 Seconds)
    const duration = 3500;
    const intervalTime = 50;
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += intervalTime;
      const currentProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(currentProgress);

      if (currentProgress > 25 && currentProgress <= 50) setLoadingText('Synchronizing Resource Markets...');
      if (currentProgress > 50 && currentProgress <= 75) setLoadingText('Establishing Command Node Link...');
      if (currentProgress > 75) setLoadingText('Authenticating Commander Protocols...');

      if (elapsed >= duration) {
        clearInterval(interval);
        setTimeout(() => setIsLoading(false), 200);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, []);

  // 🔥 THE MILITARY FIRE LOADING SCREEN 🔥
  if (isLoading) {
    return (
      <VideoLoadingScreen
        progress={progress}
        loadingText={loadingText}
        commanderName={userName}
        onComplete={() => setIsLoading(false)}
      />
    );
  }

  // 🌍 THE MAIN DASHBOARD (Post-Load) 🌍
  return (
    <div className="min-h-screen bg-[#0a0f14] text-white p-4 font-sans relative">
      <header className="relative z-10 flex justify-between items-center border-b border-red-900/50 pb-4 mb-6">
        <h1 className="text-xl font-black tracking-widest text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]">WORLD DOMINION</h1>
        <div className="text-xs font-bold tracking-widest bg-red-950/30 px-3 py-1.5 rounded border border-red-900/50 text-gray-300">
          CMD: {userName.toUpperCase()}
        </div>
      </header>
      
      <main className="relative z-10 flex flex-col items-center justify-center mt-10">
         <div className="text-center border border-red-900/30 bg-black/60 p-8 rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.1)] backdrop-blur-md">
            <h2 className="text-2xl font-bold mb-2 text-gray-200 tracking-wider">COMMAND CENTER ACTIVE</h2>
            <p className="text-red-500/80 text-sm">Awaiting map integration protocols.</p>
         </div>
      </main>
    </div>
  );
}
