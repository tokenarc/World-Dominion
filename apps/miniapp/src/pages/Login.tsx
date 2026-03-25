import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, telegramLogin } = useAuth();
  const [step, setStep] = useState<'login' | 'signup'>('login');
  const [telegramId, setTelegramId] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Login form submission (legacy email/password)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(telegramId, password);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Signup form submission - direct telegram login
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await telegramLogin(telegramId, password, firstName, lastName);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#050810',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      fontFamily: 'Arial Black, sans-serif',
    },
    card: {
      background: '#0d1117',
      border: '1px solid #8B0000',
      borderRadius: '12px',
      padding: '30px',
      maxWidth: '400px',
      width: '100%',
    },
    title: {
      fontSize: '24px',
      color: '#FFD700',
      textAlign: 'center' as const,
      marginBottom: '30px',
      letterSpacing: '2px',
    },
    input: {
      width: '100%',
      padding: '12px',
      marginBottom: '15px',
      background: '#1a1f2e',
      border: '1px solid #8B0000',
      borderRadius: '6px',
      color: '#e8e8e8',
      fontSize: '14px',
    },
    button: {
      width: '100%',
      padding: '12px',
      background: '#8B0000',
      border: 'none',
      borderRadius: '6px',
      color: '#FFD700',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      marginBottom: '15px',
    },
    toggleButton: {
      width: '100%',
      padding: '10px',
      background: 'transparent',
      border: '1px solid #8892a4',
      borderRadius: '6px',
      color: '#8892a4',
      fontSize: '14px',
      cursor: 'pointer',
    },
    error: {
      color: '#ff4444',
      textAlign: 'center' as const,
      marginBottom: '15px',
      fontSize: '12px',
    },
  };

  if (step === 'login') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.title}>WORLD DOMINION</div>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Telegram ID"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              style={styles.input}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
            {error && <div style={styles.error}>{error}</div>}
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <button
              type="button"
              style={styles.toggleButton}
              onClick={() => {
                setStep('signup');
                setError('');
                setTelegramId('');
                setPassword('');
                setFirstName('');
                setLastName('');
              }}
            >
              Need an account? Sign up
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'signup') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.title}>CREATE ACCOUNT</div>
          <form onSubmit={handleSignup}>
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Telegram ID"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              style={styles.input}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
            {error && <div style={styles.error}>{error}</div>}
            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? 'Creating...' : 'Sign Up'}
            </button>
            <button
              type="button"
              style={styles.toggleButton}
              onClick={() => setStep('login')}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }
}
