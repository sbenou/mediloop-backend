
import React from "react";
import { useSearchParams } from "react-router-dom";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import DashboardRouter from "@/components/dashboard/DashboardRouter";
import { useAuth } from "@/hooks/auth/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const PharmacyDashboard = () => {
  const { userRole, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const section = searchParams.get("section") || "dashboard";
  
  if (isLoading) {
    return (
      <PharmacistLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </PharmacistLayout>
    );
  }
  
  return (
    <PharmacistLayout>
      <DashboardRouter userRole={userRole} />
    </PharmacistLayout>
  );
};

export default PharmacyDashboard;
