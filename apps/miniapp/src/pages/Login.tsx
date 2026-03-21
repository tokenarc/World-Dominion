import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, verifyOtp } = useAuth();
  const [step, setStep] = useState<'login' | 'signup' | 'otp'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('https://world-dominion.fly.dev/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setStep('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: verify OTP and complete signup
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOtp(email, otp, password, firstName, lastName);
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
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                setEmail('');
                setPassword('');
                setFirstName('');
                setLastName('');
              }}
            >
              Don't have an account? Sign up
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
          <div style={styles.title}>Create Account</div>
          <form onSubmit={handleSendOtp}>
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
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              {loading ? 'Sending code...' : 'Sign Up'}
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

  // OTP step
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.title}>Verify Email</div>
        <form onSubmit={handleVerifyOtp}>
          <div style={{ marginBottom: '15px', color: '#8892a4', fontSize: '14px' }}>
            We sent a 6-digit code to {email}
          </div>
          <input
            type="text"
            placeholder="Enter code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={styles.input}
            required
          />
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify & Create Account'}
          </button>
          <button
            type="button"
            style={styles.toggleButton}
            onClick={() => setStep('signup')}
          >
            Go back
          </button>
        </form>
      </div>
    </div>
  );
}
