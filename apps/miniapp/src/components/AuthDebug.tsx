import { useAuth } from '../context/AuthContext';

export function AuthDebug() {
  const { state, error } = useAuth();

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#050810',
      border: '1px solid #8B0000',
      padding: '8px',
      fontSize: '10px',
      fontFamily: 'monospace',
      maxHeight: '100px',
      overflow: 'auto',
      zIndex: 9999,
    }}>
      <div style={{ color: '#FFD700', marginBottom: '4px', fontWeight: 'bold' }}>
        🔧 AUTH DEBUG
      </div>
      <div>
        <span style={{ color: '#667788' }}>State: </span>
        <span style={{ color: state === 'error' ? '#cc0000' : '#00ff88' }}>
          {state}
        </span>
      </div>
      {error && (
        <div style={{ color: '#cc0000', marginTop: '4px' }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}