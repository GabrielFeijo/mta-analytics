import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Players from './pages/Players';
import Economy from './pages/Economy';
import Layout from './components/layout/Layout';

function App() {
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        return <Login />;
    }

    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/players" element={<Players />} />
                <Route path="/economy" element={<Economy />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
    );
}

export default App;
