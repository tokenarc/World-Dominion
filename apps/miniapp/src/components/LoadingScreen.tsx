import { useEffect, useState } from 'react'
import './LoadingScreen.css'

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
    <div className="loading-screen">
      <div className="grid-bg"></div>
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className={`particle particle-${i % 5}`}></div>
        ))}
      </div>

      <div className="logo-wrapper">
        <div className="logo-ring ring-outer"></div>
        <div className="logo-ring ring-middle"></div>
        <div className="logo-ring ring-inner"></div>
        <img 
          src="/logo.png" 
          alt="World Dominion" 
          className="logo-img"
        />
      </div>

      <div className={`title-wrapper ${showText ? 'visible' : ''}`}>
        <h1 className="game-title">
          <span>W</span><span>O</span><span>R</span><span>L</span><span>D</span>
          <span> </span>
          <span>D</span><span>O</span><span>M</span><span>I</span><span>N</span><span>I</span><span>O</span><span>N</span>
        </h1>
        <p className="tagline">⚔️ 195 NATIONS • REAL ARMIES • AI LEADERS ⚔️</p>
      </div>

      <div className="progress-wrapper">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}>
            <div className="progress-glow"></div>
          </div>
        </div>
        <p className="loading-text">INITIALIZING COMMAND CENTER{dots}</p>
        <p className="progress-num">{Math.round(progress)}%</p>
      </div>
    </div>
  )
}
