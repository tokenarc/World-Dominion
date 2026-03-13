import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

export default function Dashboard() {
  const { player } = useAuth()

  return (
    <div className="page dashboard">
      <div className="dashboard-header">
        <h2>Welcome, Commander!</h2>
        {player?.currentNation && (
          <p>You are the leader of <strong>{player.currentNation}</strong></p>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon">🌍</div>
          <div className="stat-content">
            <h3>Nation</h3>
            <p>{player?.currentNation || 'Not assigned'}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div className="stat-content">
            <h3>Role</h3>
            <p>{player?.currentRole || 'No role'}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚔️</div>
          <div className="stat-content">
            <h3>Status</h3>
            <p>Active</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎖️</div>
          <div className="stat-content">
            <h3>Level</h3>
            <p>Commander</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn">View Nation Status</button>
          <button className="action-btn">Check Missions</button>
          <button className="action-btn">View Leaderboard</button>
          <button className="action-btn">Read Events</button>
        </div>
      </div>

      <div className="news-section">
        <h3>Latest News</h3>
        <div className="news-item">
          <span className="news-date">Just now</span>
          <p>Welcome to World Dominion! Start by exploring your nation and completing daily missions.</p>
        </div>
      </div>
    </div>
  )
}
