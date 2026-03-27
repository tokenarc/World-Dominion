import React, { useEffect, useState } from 'react';

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
    const totalSegments = 15;
    const activeSegments = Math.floor((progress / 100) * totalSegments);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0f14] relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(153,27,27,0.15)_0%,transparent_60%)] pointer-events-none"></div>

        <div className="z-10 text-center mb-8 mt-10">
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-200 to-gray-500 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-wider">
            WORLD DOMINION
          </h1>
          <h2 className="text-sm sm:text-base font-bold text-gray-400 tracking-[0.3em] mt-2">
            GLOBAL COMMAND SIMULATION
          </h2>
        </div>

        <div className="relative z-10 w-64 h-64 sm:w-80 sm:h-80 mb-12 flex items-center justify-center">
          <div className="absolute w-48 h-48 bg-red-600 rounded-full blur-[70px] opacity-40 animate-pulse"></div>
          <img 
            src="/logo.png" 
            alt="World Dominion Logo" 
            className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(220,38,38,0.5)] z-20 relative"
          />
        </div>

        <div className="z-10 flex flex-col items-center w-full px-6 max-w-md">
          <h3 className="text-gray-300 font-semibold tracking-widest text-sm mb-3">
            LOADING GLOBAL PROTOCOLS...
          </h3>
          
          <div className="flex gap-[2px] p-1 border border-red-900/40 rounded bg-black/80 shadow-[0_0_20px_rgba(220,38,38,0.15)] w-full justify-between">
            {Array.from({ length: totalSegments }).map((_, i) => (
              <div 
                key={i} 
                className={`h-5 w-full rounded-[1px] transition-all duration-150 ${
                  i < activeSegments 
                    ? 'bg-gradient-to-t from-red-700 via-red-500 to-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]' 
                    : 'bg-red-950/20'
                }`} 
              />
            ))}
          </div>

          <p className="text-gray-500 text-xs tracking-wider mt-4 h-4 transition-opacity duration-300">
            {loadingText}
          </p>
        </div>

        <div className="absolute bottom-4 left-4 z-10 text-[10px] text-gray-500 font-mono leading-tight">
          <p>Backend Node.js Status: <span className="text-green-500">ACTIVE</span></p>
          <p>Telegram Auth: <span className="text-red-500">ESTABLISHED</span></p>
          <p>Commander: <span className="text-gray-300">{userName.toUpperCase()}</span></p>
        </div>
      </div>
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
