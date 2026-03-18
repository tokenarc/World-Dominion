import { useEffect, useState } from 'react'
import { TelegramProvider } from './context/TelegramContext'
import { FirebaseProvider } from './context/FirebaseContext'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import LoadingScreen from './components/LoadingScreen'

function App() {
  const [isReady, setIsReady] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)

  useEffect(() => {
    // Initialize Telegram WebApp
    if ((window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.ready()
      setIsReady(true)
    } else {
      // Fallback for development
      setIsReady(true)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          return 100
        }
        return p + 4
      })
    }, 80)
    return () => clearInterval(interval)
  }, [])

  if (!isReady || loadProgress < 100) {
    return <LoadingScreen progress={loadProgress} />
  }

  return (
    <TelegramProvider>
      <FirebaseProvider>
        <AuthProvider>
          <Layout />
        </AuthProvider>
      </FirebaseProvider>
    </TelegramProvider>
  )
}

export default App
