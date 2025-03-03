
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => {
    // Redirect based on user role
    if (profile?.role === 'pharmacist') {
      navigate('/pharmacy/dashboard');
    } else if (profile?.role === 'admin' || profile?.role === 'superadmin') {
      navigate('/superadmin/dashboard');
    }
    // Default: stay on this page which renders PatientDashboard
  }, [profile, navigate]);

  // Import and render the PatientDashboard component
  const PatientDashboard = require('./PatientDashboard').default;
  return <PatientDashboard />;
};

export default Dashboard;
