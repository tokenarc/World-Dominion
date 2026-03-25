import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function StrategicLogin() {
  const router = useRouter();
  const [logs, setLogs] = useState<string[]>(['[SYSTEM] Initializing World Dominion Uplink...']);
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    const authenticateCommander = async () => {
      if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        
        const initData = tg.initData;
        const user = tg.initDataUnsafe?.user;

        if (user) {
          addLog(`[SECURE] Uplink established for Commander @${user.username || user.id}`);
          setProgress(40);
          
          try {
            addLog('[DATA] Decrypting satellite data and fetching profile...');
            const response = await fetch('/api/auth/telegram-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                telegramId: user.id.toString(),
                password: 'tg_silent_auth',
                firstName: user.first_name,
                username: user.username || ''
              })
            });

            if (response.ok) {
              const data = await response.json();
              localStorage.setItem('token', data.token);
              setProgress(100);
              addLog('[READY] Authorization complete. Entering command center.');
              
              setTimeout(() => router.push('/Dashboard'), 1500);
            } else {
              addLog('[ERROR] Authorization failed. Server rejected uplink.');
            }
          } catch (error) {
            addLog('[ERROR] Critical connection failure.');
          }
        } else {
          addLog('[WARNING] Telegram environment not detected. Please open via Telegram Bot.');
        }
      } else {
        addLog('[WARNING] Awaiting Telegram WebApp Context...');
      }
    };

    authenticateCommander();
  }, [router]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 font-mono text-green-500">
      <div className="w-full max-w-md border border-green-800 bg-gray-900/50 p-6 rounded-lg shadow-[0_0_15px_rgba(0,255,0,0.1)]">
        <h1 className="text-2xl font-bold text-center text-red-600 mb-6 tracking-widest">
          WORLD DOMINION
        </h1>
        
        <div className="h-48 overflow-y-auto mb-6 bg-black border border-green-900 p-3 text-sm rounded">
          {logs.map((log, index) => (
            <div key={index} className="mb-1 opacity-80">{log}</div>
          ))}
        </div>

        <div className="w-full bg-gray-800 h-2 rounded overflow-hidden">
          <div 
            className="bg-red-600 h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center mt-2 text-xs text-green-700">CONNECTION STATUS: {progress}%</p>
      </div>
    </div>
  );
}
