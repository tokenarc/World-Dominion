import { useEffect, useState } from 'react'
import { TelegramProvider } from './context/TelegramContext'
import { FirebaseProvider } from './context/FirebaseContext'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'

function App() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready()
      setIsReady(true)
    } else {
      // Fallback for development
      setIsReady(true)
    }
  }, [])

  if (!isReady) {
    return <div className="loading">Loading World Dominion...</div>
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
