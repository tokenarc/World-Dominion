import { useAuth } from '../context/AuthContext';

export function AuthDebug() {
  const { authStage, authError, debugInfo } = useAuth();

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#0a0f14',
      border: '1px solid #cc0000',
      padding: '12px',
      fontSize: '10px',
      fontFamily: 'monospace',
      maxHeight: '200px',
      overflow: 'auto',
      zIndex: 9999,
    }}>
      <div style={{ color: '#FFD700', marginBottom: '8px', fontWeight: 'bold' }}>
        🔧 AUTH DEBUGGER
      </div>
      <div style={{ marginBottom: '8px' }}>
        <span style={{ color: '#8892a4' }}>Stage: </span>
        <span style={{ color: authStage === 'error' ? '#cc0000' : '#00ff88' }}>
          {authStage}
        </span>
      </div>

      {authError && (
        <div style={{ color: '#cc0000', marginBottom: '8px' }}>
          ⚠️ {authError}
        </div>
      )}

      <details>
        <summary style={{ color: '#8892a4', cursor: 'pointer' }}>
          Debug Info (click to expand)
        </summary>
        <pre style={{ 
          color: '#00ff88', 
          marginTop: '8px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </details>
    </div>
  );
}