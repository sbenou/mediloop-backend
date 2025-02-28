
import { useEffect } from "react";
import { PatientLayout } from "@/components/layout/PatientLayout";
import { Profile as ProfileComponent } from "@/components/settings/Profile";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";

const Profile = () => {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect superadmin users back to their dashboard
    if (!isLoading && profile?.role === 'superadmin') {
      navigate('/superadmin/dashboard');
    }
    
    // Redirect pharmacist users back to their dashboard
    if (!isLoading && profile?.role === 'pharmacist') {
      navigate('/pharmacy/dashboard');
    }
  }, [profile, isLoading, navigate]);

  // Don't render for superadmin or pharmacists
  if (isLoading || profile?.role === 'superadmin' || profile?.role === 'pharmacist') {
    return null;
  }

  return (
    <PatientLayout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
        <ProfileComponent />
      </div>
    </PatientLayout>
  );
};

export default Profile;
