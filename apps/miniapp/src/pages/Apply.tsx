import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  { id: 'military', name: 'Military', emoji: '⚔️',
    roles: ['Supreme Commander','General','Admiral','Air Force Commander'] },
  { id: 'political', name: 'Political', emoji: '🏛️',
    roles: ['President','Prime Minister','Foreign Minister','UN Ambassador'] },
  { id: 'economic', name: 'Economic', emoji: '💰',
    roles: ['Finance Minister','Central Bank Governor','Oil Minister','Trade Minister'] },
  { id: 'intelligence', name: 'Intelligence', emoji: '🕵️',
    roles: ['Director of Intelligence','Station Chief','Cyber Commander','Field Agent'] },
  { id: 'religious', name: 'Religious', emoji: '🕊️',
    roles: ['Supreme Religious Leader','Grand Mufti','Pope / Patriarch'] }
]

export default function Apply() {
  const { player } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [statement, setStatement] = useState('')
  const [nationCode, setNationCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!selectedRole || !nationCode || !statement) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/roles/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, nationCode, statement })
      })
      const data = await res.json()
      setResult(data.message || (data.success ? '✅ Application submitted!' : '❌ Failed'))
    } catch {
      setResult('❌ Error submitting application')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="page">
        <h2>📋 Role Application</h2>
        <div className="stat-card">
          <p style={{ fontSize: '1.2rem' }}>{result}</p>
          <button className="action-btn" onClick={() => setResult(null)}>
            Apply for Another Role
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <h2>📋 Apply for Role</h2>
      {player?.currentRole && (
        <div className="stat-card">
          <p>Current Role: <strong>{player.currentRole}</strong></p>
          <p>Nation: <strong>{player.currentNation}</strong></p>
        </div>
      )}

      <div className="stat-card">
        <h3>1. Choose Category</h3>
        <div className="action-buttons">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`action-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => { setSelectedCategory(cat.id); setSelectedRole(null) }}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {selectedCategory && (
        <div className="stat-card">
          <h3>2. Choose Role</h3>
          <div className="action-buttons">
            {CATEGORIES.find(c => c.id === selectedCategory)?.roles.map(role => (
              <button
                key={role}
                className={`action-btn ${selectedRole === role ? 'active' : ''}`}
                onClick={() => setSelectedRole(role)}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedRole && (
        <div className="stat-card">
          <h3>3. Nation Code</h3>
          <input
            type="text"
            placeholder="e.g. US, CN, RU, PK"
            value={nationCode}
            onChange={e => setNationCode(e.target.value.toUpperCase())}
            maxLength={3}
            style={{
              width: '100%', padding: '10px',
              background: '#1a1f2e', border: '1px solid #00ff88',
              color: '#fff', borderRadius: '8px',
              fontSize: '1.1rem', marginBottom: '10px'
            }}
          />
          <h3>4. Your Statement</h3>
          <textarea
            placeholder="Why should you get this role? What is your strategy?"
            value={statement}
            onChange={e => setStatement(e.target.value)}
            rows={4}
            style={{
              width: '100%', padding: '10px',
              background: '#1a1f2e', border: '1px solid #00ff88',
              color: '#fff', borderRadius: '8px',
              fontSize: '0.9rem', resize: 'vertical'
            }}
          />
          <button
            className="action-btn"
            onClick={handleSubmit}
            disabled={submitting || !statement || !nationCode}
            style={{ marginTop: '10px', width: '100%' }}
          >
            {submitting ? '⏳ Submitting...' : '📋 Submit Application'}
          </button>
        </div>
      )}
    </div>
  )
}
