/// <reference types="vite/client" />

interface Window {
  Telegram?: {
    WebApp: {
      ready: () => void
      close: () => void
      expand: () => void
      initData: string
      initDataUnsafe: {
        user?: {
          id: number
          is_bot: boolean
          first_name: string
          last_name?: string
          username?: string
          language_code?: string
          is_premium?: boolean
          photo_url?: string
        }
      }
      setHeaderColor: (color: string) => void
      setBackgroundColor: (color: string) => void
      sendData: (data: string) => void
    }
  }
}
