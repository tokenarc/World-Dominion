import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, player, logout } = useAuth();

  const gameUID = user?.id ? `WD-${String(user.id).slice(-6).toUpperCase()}` : 'WD-??????';
  const initials = user?.firstName?.[0]?.toUpperCase() || '?';
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  const styles = {
    container: {
      padding: '20px',
      color: '#e8e8e8',
      fontFamily: 'Arial Black, sans-serif',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      marginBottom: '30px',
      padding: '20px',
      background: 'rgba(13, 17, 23, 0.8)',
      border: '1px solid #8B0000',
      borderRadius: '12px',
    },
    avatar: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      background: '#8B0000',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '32px',
      color: '#FFD700',
      border: '2px solid #FFD700',
    },
    info: {
      flex: 1,
    },
    name: {
      fontSize: '20px',
      color: '#FFD700',
      marginBottom: '5px',
    },
    uid: {
      fontSize: '12px',
      color: '#8892a4',
      letterSpacing: '1px',
    },
    section: {
      marginBottom: '20px',
      padding: '20px',
      background: 'rgba(13, 17, 23, 0.6)',
      border: '1px solid rgba(139, 0, 0, 0.3)',
      borderRadius: '12px',
    },
    sectionTitle: {
      fontSize: '14px',
      color: '#8892a4',
      marginBottom: '15px',
      letterSpacing: '2px',
      textTransform: 'uppercase' as const,
    },
    statRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '10px',
    },
    statLabel: {
      color: '#8892a4',
      fontSize: '14px',
    },
    statValue: {
      color: '#e8e8e8',
      fontSize: '14px',
      fontWeight: 'bold',
    },
    logoutButton: {
      width: '100%',
      padding: '12px',
      background: 'transparent',
      border: '1px solid #8B0000',
      borderRadius: '6px',
      color: '#8B0000',
      fontSize: '14px',
      fontWeight: 'bold',
      cursor: 'pointer',
      marginTop: '20px',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.avatar}>{initials}</div>
        <div style={styles.info}>
          <div style={styles.name}>{fullName}</div>
          <div style={styles.uid}>{gameUID}</div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Account Information</div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Email</span>
          <span style={styles.statValue}>{user?.email}</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Status</span>
          <span style={styles.statValue}>Verified Commander</span>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Military Stats</div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Role</span>
          <span style={styles.statValue}>{player?.stats?.role || 'CIVILIAN'}</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Nation</span>
          <span style={styles.statValue}>{player?.stats?.nation || 'UNASSIGNED'}</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Reputation</span>
          <span style={styles.statValue}>{player?.stats?.reputation || 50}</span>
        </div>
      </div>

      <button style={styles.logoutButton} onClick={logout}>
        TERMINATE SESSION (LOGOUT)
      </button>
    </div>
  );
}
