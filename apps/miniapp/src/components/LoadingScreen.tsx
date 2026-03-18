import { useEffect, useState } from 'react'

export default function LoadingScreen({ progress = 0 }: { progress?: number }) {
  const [dots, setDots] = useState('')
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.')
    }, 500)
    setTimeout(() => setShowText(true), 800)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); }
        }
        @keyframes float {
          0% { transform: translateY(100vh) scale(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
        }
        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.02); }
        }
        @keyframes letterDrop {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}} />
      
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#050810',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        overflow: 'hidden',
        fontFamily: 'Arial, sans-serif',
        zIndex: 9999
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,50,50,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,50,50,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          animation: 'gridMove 8s linear infinite'
        }}></div>
        
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {[...Array(20)].map((_, i) => {
            const configs = [
              { left: '10%', duration: '6s', delay: '0s', bg: '#ff3333' },
              { left: '25%', duration: '8s', delay: '1s', bg: '#ffd700' },
              { left: '50%', duration: '5s', delay: '2s', bg: '#ff3333' },
              { left: '75%', duration: '7s', delay: '0.5s', bg: '#ffd700' },
              { left: '90%', duration: '9s', delay: '1.5s', bg: '#ff3333' }
            ];
            const config = configs[i % 5];
            return (
              <div key={i} style={{
                position: 'absolute',
                width: '3px',
                height: '3px',
                borderRadius: '50%',
                background: config.bg,
                left: config.left,
                animation: `float ${config.duration} linear infinite`,
                animationDelay: config.delay
              }}></div>
            );
          })}
        </div>

        <div style={{
          position: 'relative',
          width: '200px',
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            position: 'absolute',
            borderRadius: '50%',
            border: '1px solid rgba(255, 50, 50, 0.3)',
            width: '200px',
            height: '200px',
            animation: 'ringPulse 2s ease-in-out infinite',
            animationDelay: '0s'
          }}></div>
          <div style={{
            position: 'absolute',
            borderRadius: '50%',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            width: '220px',
            height: '220px',
            animation: 'ringPulse 2s ease-in-out infinite',
            animationDelay: '0.3s'
          }}></div>
          <div style={{
            position: 'absolute',
            borderRadius: '50%',
            border: '1px solid rgba(255, 50, 50, 0.1)',
            width: '240px',
            height: '240px',
            animation: 'ringPulse 2s ease-in-out infinite',
            animationDelay: '0.6s'
          }}></div>
          <img 
            src="/logo.png" 
            alt="World Dominion" 
            style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              objectFit: 'cover',
              animation: 'logoFloat 3s ease-in-out infinite',
              filter: 'drop-shadow(0 0 20px rgba(255, 50, 50, 0.8))',
              zIndex: 2
            }}
          />
        </div>

        <div style={{
          textAlign: 'center',
          opacity: showText ? 1 : 0,
          transform: showText ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s ease'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 900,
            letterSpacing: '6px',
            color: '#ffd700',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.4)',
            marginBottom: '8px'
          }}>
            {['W','O','R','L','D',' ','D','O','M','I','N','I','O','N'].map((char, idx) => (
              <span key={idx} style={{
                display: 'inline-block',
                animation: 'letterDrop 0.5s ease forwards',
                animationDelay: `${0.8 + idx * 0.1}s`,
                opacity: 0
              }}>{char === ' ' ? '\u00A0' : char}</span>
            ))}
          </h1>
          <p style={{
            fontSize: '10px',
            letterSpacing: '3px',
            color: 'rgba(255, 50, 50, 0.8)',
            textTransform: 'uppercase'
          }}>⚔️ 195 NATIONS • REAL ARMIES • AI LEADERS ⚔️</p>
        </div>

        <div style={{ width: '260px', textAlign: 'center' }}>
          <div style={{
            width: '100%',
            height: '3px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '10px'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #ff3333, #ffd700)',
              borderRadius: '2px',
              transition: 'width 0.1s ease',
              position: 'relative',
              width: `${progress}%`
            }}>
              <div style={{
                position: 'absolute',
                right: 0,
                top: '-2px',
                width: '8px',
                height: '7px',
                background: '#ffd700',
                borderRadius: '50%',
                boxShadow: '0 0 8px #ffd700'
              }}></div>
            </div>
          </div>
          <p style={{
            fontSize: '10px',
            letterSpacing: '3px',
            color: 'rgba(255, 215, 0, 0.6)',
            marginBottom: '4px'
          }}>INITIALIZING COMMAND CENTER{dots}</p>
          <p style={{
            fontSize: '12px',
            color: 'rgba(255, 50, 50, 0.5)',
            letterSpacing: '2px'
          }}>{Math.round(progress)}%</p>
        </div>
      </div>
    </>
  )
}
