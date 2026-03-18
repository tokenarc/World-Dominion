import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Header from './Header'
import Navigation from './Navigation'
import Dashboard from '../pages/Dashboard'
import Nations from '../pages/Nations'
import Market from '../pages/Market'
import Wallet from '../pages/Wallet'
import Events from '../pages/Events'
import War from '../pages/War'
import Apply from '../pages/Apply'

type Page = 'dashboard' | 'nations' | 'market' | 'wallet' | 'events' | 'war' | 'apply'

export default function Layout() {
  const { isLoading } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  if (isLoading) {
    return (
      <div style={{
        display:'flex', alignItems:'center', 
        justifyContent:'center', height:'100vh',
        background:'#050810', color:'#ffd700',
        fontSize:'14px', letterSpacing:'3px'
      }}>
        ⚔️ LOADING...
      </div>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />
      case 'nations': return <Nations />
      case 'market': return <Market />
      case 'wallet': return <Wallet />
      case 'events': return <Events />
      case 'war': return <War />
      case 'apply': return <Apply />
      default: return <Dashboard />
    }
  }

  return (
    <div className="layout">
      <Header />
      <main className="layout-main">
        {renderPage()}
      </main>
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
    </div>
  )
}
