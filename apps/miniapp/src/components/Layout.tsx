import { useState } from 'react'
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
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

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
    <div style={{
      minHeight: '100vh',
      background: '#050810',
      backgroundImage: `
        radial-gradient(circle at 20% 50%, rgba(139,0,0,0.05) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255,215,0,0.03) 0%, transparent 50%)
      `
    }}>
      <Header />
      <main style={{ paddingTop: '0', paddingBottom: '70px' }}>
        {renderPage()}
      </main>
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
    </div>
  )
}
