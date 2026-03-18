import { useState } from 'react'
import { haptics } from '../lib/haptics'

const CATEGORIES = [
  { 
    id: 'military', name: 'MILITARY', emoji: '⚔️',
    desc: 'Command armies and declare war',
    color: '#cc0000',
    roles: ['Supreme Commander','General','Admiral','Air Force Commander','Defense Contractor']
  },
  { 
    id: 'political', name: 'POLITICAL', emoji: '🏛️',
    desc: 'Lead nations and forge alliances',
    color: '#FFD700',
    roles: ['President','Prime Minister','Foreign Minister','UN Ambassador','Opposition Leader']
  },
  { 
    id: 'economic', name: 'ECONOMIC', emoji: '💰',
    desc: 'Control markets and resources',
    color: '#00ff88',
    roles: ['Finance Minister','Central Bank Governor','Oil Minister','Trade Minister','Tech CEO']
  },
  { 
    id: 'intelligence', name: 'INTELLIGENCE', emoji: '🕵️',
    desc: 'Run covert operations',
    color: '#8892a4',
    roles: ['Spy Chief','Station Chief','Cyber Commander','Field Agent','Propagandist']
  },
  { 
    id: 'religious', name: 'RELIGIOUS', emoji: '🕊️',
    desc: 'Guide spiritual influence',
    color: '#b8860b',
    roles: ['Supreme Religious Leader','Grand Mufti','Pope','Chief Rabbi','Dalai Lama']
  }
]

export default function Apply() {
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [nationCode, setNationCode] = useState('')
  const [statement, setStatement] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async () => {
    if (!selectedRole || !nationCode || !statement) return
    haptics?.heavy?.()
    setSubmitting(true)
    try {
      const res = await fetch('https://world-dominion.onrender.com/api/roles/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          role: selectedRole, 
          nationCode: nationCode.toUpperCase(), 
          statement 
        })
      })
      const data = await res.json()
      haptics?.success?.()
      setResult({ success: true, message: data.message || 'Application submitted!' })
    } catch {
      haptics?.error?.()
      setResult({ success: false, message: 'Failed — try again' })
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div style={{ padding: '20px', paddingBottom: '80px' }}>
        <div style={{
          background: result.success 
            ? 'linear-gradient(135deg, #0d1117, #001a0d)'
            : 'linear-gradient(135deg, #0d1117, #1a0505)',
          border: `1px solid ${result.success ? '#00ff88' : '#cc0000'}`,
          borderRadius: '12px',
          padding: '30px 20px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(circle at 50% 50%, ${result.success ? 'rgba(0,255,136,0.1)' : 'rgba(204,0,0,0.1)'} 0%, transparent 70%)`
          }} />
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            {result.success ? '🎖️' : '❌'}
          </div>
          <div style={{
            fontSize: '14px', letterSpacing: '3px', fontWeight: 'bold',
            color: result.success ? '#00ff88' : '#cc0000',
            marginBottom: '12px'
          }}>
            {result.success ? 'ENLISTMENT SUBMITTED' : 'SUBMISSION FAILED'}
          </div>
          <div style={{ fontSize: '12px', color: '#8892a4', marginBottom: '24px' }}>
            {result.message}
          </div>
          <button
            onClick={() => { setResult(null); setSelectedCategory(null); setSelectedRole(null) }}
            style={{
              background: 'linear-gradient(135deg, #8B0000, #cc0000)',
              border: 'none', borderRadius: '8px',
              padding: '12px 24px', color: '#FFD700',
              fontSize: '11px', letterSpacing: '3px',
              fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            APPLY AGAIN
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '9px', color: '#8B0000', letterSpacing: '3px', marginBottom: '4px' }}>
          ⚔️ MILITARY ENLISTMENT BUREAU
        </div>
        <div style={{ fontSize: '20px', fontWeight: 900, color: '#FFD700', letterSpacing: '2px' }}>
          APPLY FOR COMMAND
        </div>
      </div>

      {/* Category Selection */}
      {!selectedCategory && (
        <div>
          <div style={{ 
            fontSize: '10px', color: '#8892a4', 
            letterSpacing: '2px', marginBottom: '12px' 
          }}>
            SELECT YOUR DIVISION
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { haptics?.medium?.(); setSelectedCategory(cat) }}
                style={{
                  background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
                  border: `1px solid ${cat.color}`,
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  position: 'relative',
                  overflow: 'hidden',
                  transform: 'perspective(500px) rotateX(0deg)',
                  boxShadow: `0 4px 15px ${cat.color}20, inset 0 1px 0 ${cat.color}30`
                }}
              >
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `radial-gradient(circle at 0% 50%, ${cat.color}15 0%, transparent 60%)`
                }} />
                <div style={{
                  fontSize: '32px',
                  filter: `drop-shadow(0 0 8px ${cat.color})`,
                  zIndex: 1
                }}>
                  {cat.emoji}
                </div>
                <div style={{ zIndex: 1 }}>
                  <div style={{ 
                    fontSize: '13px', fontWeight: 900, 
                    color: cat.color, letterSpacing: '2px',
                    marginBottom: '3px'
                  }}>
                    {cat.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8892a4' }}>
                    {cat.desc}
                  </div>
                </div>
                <div style={{ 
                  marginLeft: 'auto', color: cat.color, 
                  fontSize: '18px', zIndex: 1 
                }}>›</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Role Selection */}
      {selectedCategory && !selectedRole && (
        <div>
          <button
            onClick={() => { haptics?.light?.(); setSelectedCategory(null) }}
            style={{
              background: 'none', border: '1px solid #8B0000',
              borderRadius: '6px', padding: '6px 12px',
              color: '#8B0000', fontSize: '10px',
              letterSpacing: '2px', cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            ← BACK
          </button>
          <div style={{ 
            fontSize: '10px', color: '#8892a4', 
            letterSpacing: '2px', marginBottom: '12px' 
          }}>
            {selectedCategory.emoji} SELECT ROLE — {selectedCategory.name}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedCategory.roles.map((role: string) => (
              <button
                key={role}
                onClick={() => { haptics?.medium?.(); setSelectedRole(role) }}
                style={{
                  background: 'linear-gradient(135deg, #0d1117, #161b22)',
                  border: `1px solid ${selectedCategory.color}60`,
                  borderRadius: '8px',
                  padding: '14px 16px',
                  color: '#e8e8e8',
                  fontSize: '12px',
                  letterSpacing: '1px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: `0 2px 10px ${selectedCategory.color}10`
                }}
              >
                <span style={{ color: selectedCategory.color }}>▸</span>
                {role.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Application Form */}
      {selectedRole && (
        <div>
          <button
            onClick={() => { haptics?.light?.(); setSelectedRole(null) }}
            style={{
              background: 'none', border: '1px solid #8B0000',
              borderRadius: '6px', padding: '6px 12px',
              color: '#8B0000', fontSize: '10px',
              letterSpacing: '2px', cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            ← BACK
          </button>

          <div style={{
            background: 'linear-gradient(135deg, #0d1117, #1a0a0a)',
            border: `1px solid ${selectedCategory.color}`,
            borderRadius: '10px', padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '9px', color: '#8892a4', letterSpacing: '2px' }}>
              SELECTED ROLE
            </div>
            <div style={{ 
              fontSize: '16px', fontWeight: 900, 
              color: selectedCategory.color, letterSpacing: '2px',
              marginTop: '4px'
            }}>
              {selectedRole.toUpperCase()}
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ 
              fontSize: '10px', color: '#8892a4', 
              letterSpacing: '2px', marginBottom: '8px' 
            }}>
              NATION CODE (e.g. US, PK, CN, RU)
            </div>
            <input
              type="text"
              placeholder="ENTER ISO CODE..."
              value={nationCode}
              onChange={e => setNationCode(e.target.value.toUpperCase())}
              maxLength={3}
              style={{
                width: '100%', padding: '12px 14px',
                background: '#0d1117',
                border: `1px solid ${nationCode ? selectedCategory.color : '#8B0000'}`,
                borderRadius: '8px', color: '#FFD700',
                textAlign: 'center'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              fontSize: '10px', color: '#8892a4', 
              letterSpacing: '2px', marginBottom: '8px' 
            }}>
              COMMANDER STATEMENT
            </div>
            <textarea
              placeholder="Why should you lead? What is your strategy for world domination?"
              value={statement}
              onChange={e => setStatement(e.target.value)}
              rows={4}
              style={{
                width: '100%', padding: '12px 14px',
                background: '#0d1117', border: '1px solid #8B0000',
                borderRadius: '8px', color: '#e8e8e8',
                fontSize: '12px', lineHeight: '1.6',
                outline: 'none', resize: 'none'
              }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !nationCode || !statement}
            style={{
              width: '100%',
              background: submitting || !nationCode || !statement
                ? '#1a1a1a'
                : 'linear-gradient(135deg, #8B0000, #cc0000)',
              border: `1px solid ${submitting || !nationCode || !statement ? '#333' : '#FFD700'}`,
              borderRadius: '10px',
              padding: '16px',
              color: submitting || !nationCode || !statement ? '#555' : '#FFD700',
              fontSize: '12px', letterSpacing: '3px',
              fontWeight: 900, cursor: 'pointer',
              boxShadow: submitting ? 'none' : '0 4px 20px rgba(139,0,0,0.4)'
            }}
          >
            {submitting ? '⏳ PROCESSING...' : '⚔️ SUBMIT ENLISTMENT'}
          </button>
        </div>
      )}
    </div>
  )
}
