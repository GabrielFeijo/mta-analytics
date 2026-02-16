import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Players from './pages/Players';
import Economy from './pages/Economy';
import Resources from './pages/Resources';
import Fines from './pages/Fines';
import Layout from './components/layout/Layout';

function App() {
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
        <Layout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/players" element={<Players />} />
                <Route path="/economy" element={<Economy />} />
                <Route path="/fines" element={<Fines />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
    );
}

export default App;
