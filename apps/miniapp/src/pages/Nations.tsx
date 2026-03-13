import { useState, useEffect } from 'react'

interface Nation {
  id: string
  name: string
  flag: string
  gdp: number
  stability: number
  militaryStrength: number
}

export default function Nations() {
  const [nations, setNations] = useState<Nation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch nations from API
    const fetchNations = async () => {
      try {
        const response = await fetch('/api/nations')
        if (response.ok) {
          const data = await response.json()
          setNations(data.slice(0, 10))
        }
      } catch (error) {
        console.error('Failed to fetch nations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNations()
  }, [])

  if (loading) {
    return <div className="page nations"><p>Loading nations...</p></div>
  }

  return (
    <div className="page nations">
      <div className="page-header">
        <h2>🌍 Nations</h2>
        <p>Explore the world's nations and their stats</p>
      </div>

      <div className="nations-list">
        {nations.length === 0 ? (
          <p className="empty-state">No nations available</p>
        ) : (
          nations.map(nation => (
            <div key={nation.id} className="nation-card">
              <div className="nation-header">
                <span className="nation-flag">{nation.flag}</span>
                <div className="nation-info">
                  <h3>{nation.name}</h3>
                  <p className="nation-id">{nation.id}</p>
                </div>
              </div>

              <div className="nation-stats">
                <div className="stat">
                  <span className="stat-label">GDP</span>
                  <span className="stat-value">${nation.gdp}B</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Stability</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${nation.stability}%` }}></div>
                  </div>
                </div>
                <div className="stat">
                  <span className="stat-label">Military</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${nation.militaryStrength}%` }}></div>
                  </div>
                </div>
              </div>

              <button className="view-btn">View Details</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
