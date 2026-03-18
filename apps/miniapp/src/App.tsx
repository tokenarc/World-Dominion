import { useEffect, useState } from 'react'
import { TelegramProvider } from './context/TelegramContext'
import { FirebaseProvider } from './context/FirebaseContext'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import LoadingScreen from './components/LoadingScreen'

function App() {
  const [isReady, setIsReady] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [loadStatus, setLoadStatus] = useState('Initializing...')

  useEffect(() => {
    const initApp = async () => {
      try {
        setLoadStatus('Initializing Telegram...')
        setLoadProgress(15)
        if ((window as any).Telegram?.WebApp) {
          (window as any).Telegram.WebApp.ready()
          (window as any).Telegram.WebApp.expand()
        }
        await new Promise(r => setTimeout(r, 500))

        setLoadStatus('Connecting to servers...')
        setLoadProgress(35)
        await new Promise(r => setTimeout(r, 600))

        setLoadStatus('Authenticating commander...')
        setLoadProgress(55)
        try {
          const BOT_URL = 'https://world-dominion.onrender.com'
          const initData = (window as any).Telegram?.WebApp?.initData || ''
          if (initData) {
            await fetch(`${BOT_URL}/api/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ initData }),
              signal: (AbortSignal as any).timeout(5000)
            })
          }
        } catch(e) {
          console.log('Auth in background')
        }
        await new Promise(r => setTimeout(r, 400))

        setLoadStatus('Loading world map...')
        setLoadProgress(75)
        await new Promise(r => setTimeout(r, 500))

        setLoadStatus('Deploying NPC commanders...')
        setLoadProgress(90)
        await new Promise(r => setTimeout(r, 400))

        setLoadStatus('COMMAND CENTER READY')
        setLoadProgress(100)
        await new Promise(r => setTimeout(r, 800))

        setIsReady(true)
      } catch (error) {
        console.error('Init error:', error)
        setIsReady(true)
      }
    }
    initApp()
  }, [])

  if (!isReady) {
    return (
      <LoadingScreen
        progress={loadProgress}
        status={loadStatus}
      />
    )
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
