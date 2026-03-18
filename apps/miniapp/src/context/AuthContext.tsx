import React, { createContext, useContext, useState, useEffect } from 'react'
import { useTelegram } from './TelegramContext'

interface Player {
  id: string
  telegramId: number
  username: string
  currentNation?: string
  currentRole?: string
  isNPC: boolean
  createdAt: Date
}

interface AuthContextType {
  player: Player | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (initData: string) => Promise<void>
  logout: () => void
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initData } = useTelegram()
  const [player, setPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initData && user) {
      login(initData).catch(console.error)
    }
  }, [initData, user])

  const login = async (initData: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const BOT_API = process.env.NEXT_PUBLIC_BOT_API_URL || 'https://world-dominion.onrender.com'
      const response = await fetch(`${BOT_API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData })
      })

      if (!response.ok) {
        throw new Error('Authentication failed')
      }

      const data = await response.json()
      setPlayer(data.player)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setPlayer(null)
    setError(null)
  }

  return (
    <AuthContext.Provider
      value={{
        player,
        isLoading,
        isAuthenticated: !!player,
        login,
        logout,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
