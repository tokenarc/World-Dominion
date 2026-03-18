import { useState, useEffect } from 'react'

interface Stock {
  id: string
  symbol: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
  category?: string
}

export default function Market() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await fetch('https://world-dominion.onrender.com/api/market')
        const data = await response.json()
        setStocks(data.stocks || [])
      } catch (error) {
        console.error('Failed to fetch stocks:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStocks()
  }, [])

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '9px', color: '#8B0000', letterSpacing: '3px', marginBottom: '4px' }}>
          📈 GLOBAL RESOURCE EXCHANGE
        </div>
        <div style={{ fontSize: '20px', fontWeight: 900, color: '#FFD700', letterSpacing: '2px' }}>
          MARKET TERMINAL
        </div>
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
          SYNCING MARKET DATA...
          <style dangerouslySetInnerHTML={{ __html: \`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          \`}} />
        </div>
      )}

      {!loading && stocks.length === 0 && (
        <div style={{ textAlign: 'center', color: '#8892a4',
          fontSize: '11px', padding: '40px' }}>
          MARKET CLOSED OR NO DATA AVAILABLE
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {stocks.map(stock => (
          <div key={stock.id} style={{
            background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
            border: '1px solid #8B0000',
            borderRadius: '10px',
            padding: '12px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(139,0,0,0.1)'
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
              background: stock.change >= 0 ? 'linear-gradient(90deg, transparent, #00ff88, transparent)' : 'linear-gradient(90deg, transparent, #cc0000, transparent)'
            }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#FFD700', letterSpacing: '1px' }}>
                  {stock.symbol}
                </div>
                <div style={{ fontSize: '8px', color: '#8892a4', textTransform: 'uppercase' }}>
                  {stock.name}
                </div>
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: stock.change >= 0 ? '#00ff88' : '#cc0000',
                fontWeight: 'bold'
              }}>
                {stock.change >= 0 ? '▲' : '▼'}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e8e8e8' }}>
                ${stock.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ 
                fontSize: '10px', 
                color: stock.change >= 0 ? '#00ff88' : '#cc0000'
              }}>
                {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </div>
            </div>

            <button style={{
              width: '100%',
              background: 'rgba(139,0,0,0.1)',
              border: '1px solid #8B0000',
              borderRadius: '6px',
              padding: '6px',
              color: '#FFD700',
              fontSize: '9px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              TRADE
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
