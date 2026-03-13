import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

interface War {
  id: string
  aggressorName: string
  defenderName: string
  warScore: number
  currentRound: number
  status: string
}

export default function War() {
  const { player } = useAuth()
  const [wars, setWars] = useState<War[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/war/active')
      .then(r => r.json())
      .then(data => { setWars(data.wars || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <h2>⚔️ War Room</h2>
      {loading && <p>Loading wars...</p>}
      {!loading && wars.length === 0 && (
        <div className="empty-state">
          <p>🕊️ World is at peace</p>
          <p>No active wars</p>
        </div>
      )}
      {wars.map(war => (
        <div key={war.id} className="stat-card">
          <h3>{war.aggressorName} ⚔️ {war.defenderName}</h3>
          <p>War Score: {war.warScore}/100</p>
          <p>Round: {war.currentRound}</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${war.warScore}%`, background: '#ff3333' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
