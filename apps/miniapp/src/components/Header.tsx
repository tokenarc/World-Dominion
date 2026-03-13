import { useAuth } from '../context/AuthContext'
import './Header.css'

export default function Header() {
  const { player } = useAuth()

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-title">
          <h1>🌍 World Dominion</h1>
        </div>
        {player && (
          <div className="header-player">
            <span className="player-name">{player.username}</span>
            {player.currentNation && (
              <span className="player-nation">{player.currentNation}</span>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
