import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './auth';
import Loader from './components/Loader';
import RouteProgress from './components/RouteProgress';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Animals from './pages/Animals';
import AnimalDetail from './pages/AnimalDetail';
import Milk from './pages/Milk';
import Health from './pages/Health';
import Breeding from './pages/Breeding';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function Private({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <Loader />;
  return session ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const location = useLocation();
  const { loading } = useAuth();
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    document.getElementById('boot-loader')?.remove();
    const t = setTimeout(() => setSplash(false), 1100);
    return () => clearTimeout(t);
  }, []);

  const inApp = location.pathname.startsWith('/app');

  return (
    <>
      <div className="bg-scene" aria-hidden="true">
        <span className="blob b1" /><span className="blob b2" /><span className="blob b3" /><span className="blob b4" />
      </div>
      <AnimatePresence>{(splash || loading) && <Loader key="splash" full />}</AnimatePresence>
      <RouteProgress routeKey={location.pathname} />
      {splash || loading ? null : inApp ? (
        <Private>
          <Layout>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/app" element={<Dashboard />} />
                <Route path="/app/animals" element={<Animals />} />
                <Route path="/app/animals/:id" element={<AnimalDetail />} />
                <Route path="/app/milk" element={<Milk />} />
                <Route path="/app/health" element={<Health />} />
                <Route path="/app/breeding" element={<Breeding />} />
                <Route path="/app/reports" element={<Reports />} />
                <Route path="/app/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/app" replace />} />
              </Routes>
            </AnimatePresence>
          </Layout>
        </Private>
      ) : (
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      )}
    </>
  );
}
