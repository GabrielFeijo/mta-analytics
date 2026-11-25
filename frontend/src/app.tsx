import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { authApi } from './services/auth-api';
import { useAuthStore } from './stores/auth-store';
import AppLayout from './components/layout/app-layout';
import Dashboard from './pages/dashboard';
import Economy from './pages/economy';
import Fines from './pages/fines';
import Login from './pages/login';
import Operators from './pages/operators';
import Players from './pages/players';
import Register from './pages/register';
import Resources from './pages/resources';

export function App() {
  const { isAuthenticated, isDemoMode, token, user, setUser } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || isDemoMode || !token) {
      return;
    }
    let cancelled = false;
    void authApi
      .me()
      .then((freshUser) => {
        if (!cancelled && freshUser) {
          setUser(freshUser);
        }
      })
      .catch(() => {
        // Session invalidation is handled by the 401 HTTP interceptor
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isDemoMode, token, setUser]);

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
        <Route
          path="/operators"
          element={user?.role === 'ADMIN' ? <Operators /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
