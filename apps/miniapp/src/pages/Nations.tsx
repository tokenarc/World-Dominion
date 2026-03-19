import { useState, useEffect } from 'react'

export default function Nations() {
  const [nations, setNations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchNations = async () => {
    try {
      setLoading(true)
      const res = await fetch(
        'https://world-dominion-666b1-default-rtdb.firebaseio.com/nations.json?limitToFirst=50'
      )
      const data = await res.json()
      
      if (data) {
        const nationsList = Object.values(data) as any[]
        setNations(nationsList)
      }
    } catch(err) {
      console.error('Nations fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNations()
  }, [])

  const filtered = nations.filter((n: any) =>
    n.name?.toLowerCase().includes(search.toLowerCase()) ||
    n.id?.toLowerCase().includes(search.toLowerCase())
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
        <div style={{ 
          textAlign: 'center', color: '#FFD700', 
          letterSpacing: '3px', fontSize: '11px', padding: '40px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
        }}>
          <div style={{ 
            width: '20px', height: '20px', border: '2px solid #8B0000', 
            borderTop: '2px solid #FFD700', borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          SCANNING GLOBAL INTELLIGENCE...
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}} />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#8892a4',
          fontSize: '11px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <div>NO NATIONS FOUND IN DATABASE</div>
          <button 
            onClick={fetchNations}
            style={{
              background: '#8B0000', color: 'white', border: 'none',
              padding: '8px 16px', borderRadius: '4px', fontSize: '10px',
              letterSpacing: '1px', cursor: 'pointer'
            }}
          >
            RETRY SYNC
          </button>
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
              background: (nation.stability || 0) > 70 ? '#00ff88' : 
                         (nation.stability || 0) > 40 ? '#FFD700' : '#cc0000'
            }} />
            <div style={{ paddingLeft: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div>
                  <span style={{ fontSize: '16px', marginRight: '6px' }}>{nation.flag || '🏳️'}</span>
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
                  STABILITY: <span style={{ color: '#FFD700' }}>{nation.stability || 0}/100</span>
                </div>
                <div style={{ fontSize: '10px', color: '#8892a4' }}>
                  MILITARY: <span style={{ color: '#cc0000' }}>{nation.militaryStrength || 0}/100</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
