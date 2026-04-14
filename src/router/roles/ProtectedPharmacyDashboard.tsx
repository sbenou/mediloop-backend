
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

const ProtectedPharmacyDashboard = () => {
  const { userRole, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    navigate(getDashboardRouteByRole(userRole), { replace: true });
  }, [isLoading, navigate, userRole]);

  return null;
};

export default ProtectedPharmacyDashboard;
