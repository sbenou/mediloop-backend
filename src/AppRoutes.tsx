
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/auth/useAuth';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import UniversalDashboard from './pages/UniversalDashboard';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFound from './pages/NotFound';

const AppRoutes = () => {
  const { isAuthenticated, userRole } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/doctor/dashboard" 
        element={isAuthenticated && userRole === 'doctor' ? <DoctorDashboard /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/universal-dashboard" 
        element={isAuthenticated ? <UniversalDashboard /> : <Navigate to="/login" />} 
      />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
