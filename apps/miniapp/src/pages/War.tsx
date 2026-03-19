import { useState, useEffect } from 'react'

export default function War() {
  const [wars, setWars] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [worldPeace, setWorldPeace] = useState(true)

  useEffect(() => {
    fetch('https://world-dominion.onrender.com/api/war/active')
      .then(r => r.json())
      .then(data => {
        const warList = data.wars || []
        setWars(warList)
        setWorldPeace(warList.length === 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '9px', color: '#8B0000', letterSpacing: '3px', marginBottom: '4px' }}>
          ⚔️ GLOBAL CONFLICT MONITOR
        </div>
        <div style={{ fontSize: '20px', fontWeight: 900, color: '#FFD700', letterSpacing: '2px' }}>
          WAR ROOM
        </div>
      </div>

      {/* World Status Banner */}
      <div style={{
        background: worldPeace 
          ? 'linear-gradient(135deg, #0d1117, #001a0d)'
          : 'linear-gradient(135deg, #0d1117, #1a0505)',
        border: `1px solid ${worldPeace ? '#00ff88' : '#cc0000'}`,
        borderRadius: '10px',
        padding: '14px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: worldPeace 
            ? 'radial-gradient(circle at 20% 50%, rgba(0,255,136,0.1) 0%, transparent 60%)'
            : 'radial-gradient(circle at 20% 50%, rgba(204,0,0,0.15) 0%, transparent 60%)'
        }} />
        <div style={{ fontSize: '32px', zIndex: 1 }}>
          {worldPeace ? '🕊️' : '💀'}
        </div>
        <div style={{ zIndex: 1 }}>
          <div style={{
            fontSize: '13px', fontWeight: 900,
            color: worldPeace ? '#00ff88' : '#cc0000',
            letterSpacing: '2px'
          }}>
            {worldPeace ? 'WORLD AT PEACE' : `${wars.length} ACTIVE CONFLICTS`}
          </div>
          <div style={{ fontSize: '10px', color: '#8892a4', marginTop: '2px' }}>
            {worldPeace 
              ? 'No active military conflicts detected'
              : 'Monitoring active war zones globally'}
          </div>
        </div>
        <div style={{
          marginLeft: 'auto',
          width: '8px', height: '8px',
          borderRadius: '50%',
          background: worldPeace ? '#00ff88' : '#cc0000',
          boxShadow: `0 0 8px ${worldPeace ? '#00ff88' : '#cc0000'}`,
          zIndex: 1,
          animation: 'pulse 2s infinite'
        }} />
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: '8px', marginBottom: '20px'
      }}>
        {[
          { label: 'ACTIVE WARS', value: wars.length, color: '#cc0000' },
          { label: 'NATIONS AT WAR', value: wars.length * 2, color: '#FFD700' },
          { label: 'PEACE INDEX', value: `${Math.max(0, 100 - wars.length * 10)}%`, color: '#00ff88' }
        ].map(stat => (
          <div key={stat.label} style={{
            background: '#0d1117',
            border: '1px solid #8B0000',
            borderRadius: '8px',
            padding: '10px 8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 900, color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '8px', color: '#8892a4', letterSpacing: '1px', marginTop: '2px' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', color: '#8B0000', letterSpacing: '3px', fontSize: '11px', padding: '20px' }}>
          ⚡ SCANNING CONFLICT ZONES...
        </div>
      )}

      {/* Active Wars */}
      {!loading && wars.length > 0 && (
        <div>
          <div style={{ fontSize: '9px', color: '#8B0000', letterSpacing: '3px', marginBottom: '12px' }}>
            ⚔️ ACTIVE CONFLICTS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {wars.map((war: any) => (
              <div key={war.id} style={{
                background: 'linear-gradient(135deg, #0d1117, #1a0505)',
                border: '1px solid #cc0000',
                borderRadius: '10px',
                padding: '14px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(circle at 50% 0%, rgba(204,0,0,0.1) 0%, transparent 60%)'
                }} />
                <div style={{ position: 'relative' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '10px'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#cc0000', letterSpacing: '2px' }}>
                      ⚔️ ACTIVE WAR
                    </div>
                    <div style={{ fontSize: '9px', color: '#8892a4' }}>
                      ROUND {war.currentRound || 0}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e8e8e8' }}>
                        {war.aggressorName || war.aggressor}
                      </div>
                      <div style={{ fontSize: '9px', color: '#cc0000', letterSpacing: '1px' }}>AGGRESSOR</div>
                    </div>
                    <div style={{ fontSize: '20px' }}>⚔️</div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e8e8e8' }}>
                        {war.defenderName || war.defender}
                      </div>
                      <div style={{ fontSize: '9px', color: '#00ff88', letterSpacing: '1px' }}>DEFENDER</div>
                    </div>
                  </div>

                  {/* War Score Bar */}
                  <div style={{ marginBottom: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ fontSize: '9px', color: '#cc0000' }}>ATK {war.warScore || 0}%</div>
                      <div style={{ fontSize: '9px', color: '#00ff88' }}>DEF {100 - (war.warScore || 0)}%</div>
                    </div>
                    <div style={{ height: '4px', background: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${war.warScore || 50}%`,
                        background: 'linear-gradient(90deg, #cc0000, #FFD700)',
                        borderRadius: '2px'
                      }} />
                    </div>
                  </div>

                  <div style={{ fontSize: '9px', color: '#8892a4', textAlign: 'center' }}>
                    CASUALTIES — ATK: {war.casualties?.aggressor || 0} | DEF: {war.casualties?.defender || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Peace Message */}
      {!loading && wars.length === 0 && (
        <div style={{
          background: '#0d1117',
          border: '1px solid #1a2a1a',
          borderRadius: '10px',
          padding: '30px 20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌍</div>
          <div style={{ fontSize: '12px', color: '#8892a4', letterSpacing: '2px', marginBottom: '8px' }}>
            ALL QUIET ON THE WESTERN FRONT
          </div>
          <div style={{ fontSize: '10px', color: '#555', letterSpacing: '1px' }}>
            No active military conflicts. 195 nations stand at ready.
          </div>
          <div style={{ marginTop: '16px', fontSize: '10px', color: '#8B0000', letterSpacing: '2px' }}>
            USE /war [ISO CODE] IN BOT TO DECLARE WAR
          </div>
        </div>
      )}
    </div>
  )
}
