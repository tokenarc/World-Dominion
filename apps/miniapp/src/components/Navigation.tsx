type Page = 'dashboard' | 'nations' | 'market' | 'wallet' | 'events' | 'war' | 'apply'

interface NavigationProps {
  currentPage: Page
  onPageChange: (page: Page) => void
}

export default function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const navItems: Array<{ id: Page; label: string; icon: string }> = [
    { id: 'dashboard', label: 'Home', icon: '📊' },
    { id: 'nations', label: 'Nations', icon: '🌍' },
    { id: 'war', label: 'War', icon: '⚔️' },
    { id: 'market', label: 'Market', icon: '📈' },
    { id: 'wallet', label: 'Wallet', icon: '💰' },
    { id: 'apply', label: 'Apply', icon: '📋' }
  ]

  return (
    <nav className="navigation">
      <div className="nav-items">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item \${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onPageChange(item.id)}
            title={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
