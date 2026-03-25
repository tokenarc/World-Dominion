import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FirebaseProvider } from './context/FirebaseContext';
import Layout from './components/Layout';
import StrategicLoadingScreen from './components/StrategicLoadingScreen';
import Dashboard from './pages/Dashboard';
import Nations from './pages/Nations';
import War from './pages/War';
import Market from './pages/Market';
import Wallet from './pages/Wallet';
import Apply from './pages/Apply';
import Profile from './pages/Profile';
import Missions from './pages/Missions';

function AppContent() {
  const { user, authStage } = useAuth();

  // Show strategic loading screen during authentication and initialization
  if (authStage !== 'ready' && authStage !== 'error') {
    return <StrategicLoadingScreen />;
  }

  // If auth failed, show error (could also show a retry button)
  if (authStage === 'error') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#050810',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#ff4444',
        fontFamily: 'Arial, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Authentication Failed</h2>
          <p>Please ensure you are accessing this app through Telegram.</p>
        </div>
      </div>
    );
  }

  // User is authenticated - show the app
  if (user) {
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/nations" element={<Nations />} />
          <Route path="/war" element={<War />} />
          <Route path="/market" element={<Market />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/missions" element={<Missions />} />
        </Routes>
      </Layout>
    );
  }

  // Fallback - shouldn't happen with telegram auth
  return <StrategicLoadingScreen />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FirebaseProvider>
          <AppContent />
        </FirebaseProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
