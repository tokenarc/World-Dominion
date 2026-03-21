import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FirebaseProvider } from './context/FirebaseContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Nations from './pages/Nations';
import War from './pages/War';
import Market from './pages/Market';
import Wallet from './pages/Wallet';
import Apply from './pages/Apply';
import Profile from './pages/Profile';
import Missions from './pages/Missions';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ background: '#050810', height: '100vh' }} />;
  }

  if (!user) {
    return <Login />;
  }

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
