import React, { createContext, useContext, useEffect, useState } from 'react'

interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  added_to_attachment_menu?: boolean
  allows_write_to_pm?: boolean
  photo_url?: string
}

interface TelegramContextType {
  user: TelegramUser | null
  initData: string | null
  isReady: boolean
  expand: () => void
  close: () => void
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined)

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [initData, setInitData] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const webApp = (window as any).Telegram.WebApp
      
      // Get user data
      if (webApp.initDataUnsafe?.user) {
        setUser(webApp.initDataUnsafe.user as TelegramUser)
      }
      
      // Get init data
      setInitData(webApp.initData)
      
      // Mark as ready
      setIsReady(true)
      
      // Expand to full height
      webApp.expand()
      
      // Set theme
      if (webApp.setHeaderColor) {
        webApp.setHeaderColor('#1a1a2e')
      }
      if (webApp.setBackgroundColor) {
        webApp.setBackgroundColor('#0f0f1e')
      }
    } else {
      // Development mode
      setIsReady(true)
      setUser({
        id: 123456789,
        is_bot: false,
        first_name: 'Developer',
        username: 'dev_user'
      })
    }
  }, [])

  const expand = () => {
    if ((window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.expand()
    }
  }

  const close = () => {
    if ((window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.close()
    }
  }

  return (
    <TelegramContext.Provider value={{ user, initData, isReady, expand, close }}>
      {children}
    </TelegramContext.Provider>
  )
}

export const useTelegram = () => {
  const context = useContext(TelegramContext)
  if (!context) {
    throw new Error('useTelegram must be used within TelegramProvider')
  }
  return context
}
