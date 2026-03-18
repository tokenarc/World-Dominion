import { useState, useEffect } from 'react'

export default function Nations() {
  const [nations, setNations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('https://world-dominion.onrender.com/api/nations')
      .then(r => r.json())
      .then(data => { setNations(data.nations || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = nations.filter((n: any) =>
    n.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', color: '#8B0000', letterSpacing: '3px', marginBottom: '8px' }}>
          🌍 GLOBAL INTELLIGENCE DATABASE
        </div>
        <input
          placeholder="SEARCH NATIONS..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px',
            background: '#0d1117', border: '1px solid #8B0000',
            borderRadius: '6px', color: '#e8e8e8',
            fontSize: '12px', letterSpacing: '2px',
            outline: 'none'
          }}
        />
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: '#8B0000', 
          letterSpacing: '3px', fontSize: '11px', padding: '40px' }}>
          ⚡ LOADING INTEL...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#8892a4',
          fontSize: '11px', padding: '40px' }}>
          NO NATIONS FOUND
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map((nation: any) => (
          <div key={nation.id} style={{
            background: 'linear-gradient(135deg, #0d1117, #161b22)',
            border: '1px solid #8B0000',
            borderRadius: '8px',
            padding: '12px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: '3px',
              background: nation.stability > 70 ? '#00ff88' : 
                         nation.stability > 40 ? '#FFD700' : '#cc0000'
            }} />
            <div style={{ paddingLeft: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div>
                  <span style={{ fontSize: '16px', marginRight: '6px' }}>{nation.flag}</span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#e8e8e8' }}>
                    {nation.name}
                  </span>
                </div>
                <span style={{ 
                  fontSize: '9px', color: '#8B0000',
                  letterSpacing: '1px', alignSelf: 'center'
                }}>
                  {nation.id}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ fontSize: '10px', color: '#8892a4' }}>
                  STABILITY: <span style={{ color: '#FFD700' }}>{nation.stability}/100</span>
                </div>
                <div style={{ fontSize: '10px', color: '#8892a4' }}>
                  MILITARY: <span style={{ color: '#cc0000' }}>{nation.militaryStrength}/100</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
