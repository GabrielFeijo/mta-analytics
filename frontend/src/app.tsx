import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './stores/auth-store';
import AppLayout from './components/layout/app-layout';
import Dashboard from './pages/dashboard';
import Economy from './pages/economy';
import Fines from './pages/fines';
import Login from './pages/login';
import Players from './pages/players';
import Register from './pages/register';
import Resources from './pages/resources';

export function App() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/players" element={<Players />} />
        <Route path="/economy" element={<Economy />} />
        <Route path="/fines" element={<Fines />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
