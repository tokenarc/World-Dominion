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

  const setGuestPlayer = (initData: string) => {
    try {
      const params = new URLSearchParams(initData)
      const userJson = params.get('user')
      if (userJson) {
        const user = JSON.parse(userJson)
        setPlayer({
          id: user.id.toString(),
          telegramId: user.id,
          username: user.username || 'Commander',
          currentNation: '',
          currentRole: '',
          isNPC: false,
          createdAt: new Date()
        })
      }
    } catch(e) {
      // Fallback guest
      setPlayer({
        id: 'guest',
        telegramId: 0,
        username: 'Commander',
        currentNation: '',
        currentRole: '',
        isNPC: false,
        createdAt: new Date()
      })
    }
  }

  const login = async (initData: string) => {
    setIsLoading(true)
    setError(null)
    
    const BOT_API = 'https://world-dominion.onrender.com'
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      console.log('Auth timeout - switching to Guest Commander mode')
    }, 3000)

    try {
      const response = await fetch(`${BOT_API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setPlayer(data.player)
      } else {
        setGuestPlayer(initData)
      }
    } catch (err) {
      clearTimeout(timeoutId)
      console.log('Auth failed or timed out, using guest mode')
      setGuestPlayer(initData)
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
