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
        setLoadProgress(10)
        if ((window as any).Telegram?.WebApp) {
          (window as any).Telegram.WebApp.ready()
        }
        await new Promise(r => setTimeout(r, 300))

        setLoadStatus('Connecting to servers...')
        setLoadProgress(30)
        await new Promise(r => setTimeout(r, 400))

        setLoadStatus('Authenticating commander...')
        setLoadProgress(50)
        await new Promise(r => setTimeout(r, 400))

        setLoadStatus('Loading world map...')
        setLoadProgress(70)
        await new Promise(r => setTimeout(r, 400))

        setLoadStatus('Briefing intelligence...')
        setLoadProgress(90)
        await new Promise(r => setTimeout(r, 300))

        setLoadStatus('COMMAND CENTER READY')
        setLoadProgress(100)
        await new Promise(r => setTimeout(r, 600))

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
