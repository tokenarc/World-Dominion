import { useState, useEffect } from 'react'

interface Stock {
  id: string
  symbol: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
}

export default function Market() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch stocks from API
    const fetchStocks = async () => {
      try {
        const response = await fetch('/api/market/stocks')
        if (response.ok) {
          const data = await response.json()
          setStocks(data.slice(0, 8))
        }
      } catch (error) {
        console.error('Failed to fetch stocks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStocks()
  }, [])

  if (loading) {
    return <div className="page market"><p>Loading market data...</p></div>
  }

  return (
    <div className="page market">
      <div className="page-header">
        <h2>📈 Market</h2>
        <p>Global commodity and stock prices</p>
      </div>

      <div className="market-grid">
        {stocks.length === 0 ? (
          <p className="empty-state">No stocks available</p>
        ) : (
          stocks.map(stock => (
            <div key={stock.id} className="stock-card">
              <div className="stock-header">
                <div className="stock-info">
                  <h3>{stock.symbol}</h3>
                  <p>{stock.name}</p>
                </div>
                <div className={`change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                  {stock.change >= 0 ? '📈' : '📉'}
                </div>
              </div>

              <div className="stock-price">
                <span className="price">${stock.currentPrice.toFixed(2)}</span>
                <span className={`percent ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                  {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </span>
              </div>

              <button className="trade-btn">Trade</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
