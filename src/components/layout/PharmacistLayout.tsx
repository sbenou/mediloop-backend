
import { ReactNode } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";

interface PharmacistLayoutProps {
  children: ReactNode;
}

const PharmacistLayout = ({ children }: PharmacistLayoutProps) => {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is authenticated and has pharmacist role
  if (!isLoading && (!isAuthenticated || (profile && profile.role !== "pharmacist"))) {
    navigate("/login", { replace: true });
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <UnifiedLayoutTemplate>
      {children}
    </UnifiedLayoutTemplate>
  );
};

export default PharmacistLayout;
