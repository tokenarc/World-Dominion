import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

interface WalletData {
  usd: number
  ton: number
  usdt: number
  totalValue: number
}

export default function Wallet() {
  const { player } = useAuth()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await fetch('/api/wallet')
        if (response.ok) {
          const data = await response.json()
          setWallet(data)
        }
      } catch (error) {
        console.error('Failed to fetch wallet:', error)
      } finally {
        setLoading(false)
      }
    }

    if (player) {
      fetchWallet()
    }
  }, [player])

  if (loading) {
    return <div className="page wallet"><p>Loading wallet...</p></div>
  }

  return (
    <div className="page wallet">
      <div className="page-header">
        <h2>💰 Wallet</h2>
        <p>Manage your assets and currency</p>
      </div>

      {wallet && (
        <>
          <div className="total-value">
            <span className="label">Total Value</span>
            <span className="amount">${wallet.totalValue.toFixed(2)}</span>
          </div>

          <div className="currency-grid">
            <div className="currency-card">
              <div className="currency-header">
                <span className="currency-icon">💵</span>
                <span className="currency-name">USD</span>
              </div>
              <div className="currency-amount">${wallet.usd.toFixed(2)}</div>
            </div>

            <div className="currency-card">
              <div className="currency-header">
                <span className="currency-icon">⚫</span>
                <span className="currency-name">TON</span>
              </div>
              <div className="currency-amount">{wallet.ton.toFixed(4)}</div>
            </div>

            <div className="currency-card">
              <div className="currency-header">
                <span className="currency-icon">🔷</span>
                <span className="currency-name">USDT</span>
              </div>
              <div className="currency-amount">${wallet.usdt.toFixed(2)}</div>
            </div>
          </div>

          <div className="wallet-actions">
            <h3>Actions</h3>
            <div className="action-grid">
              <button className="action-btn">Deposit</button>
              <button className="action-btn">Withdraw</button>
              <button className="action-btn">Send</button>
              <button className="action-btn">Receive</button>
            </div>
          </div>

          <div className="transaction-history">
            <h3>Recent Transactions</h3>
            <p className="empty-state">No transactions yet</p>
          </div>
        </>
      )}
    </div>
  )
}
