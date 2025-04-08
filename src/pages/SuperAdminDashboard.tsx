
import React from "react";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const SuperAdminDashboard = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const section = searchParams.get('section') || 'dashboard';

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedLayoutTemplate>
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
        <ScrollArea className="h-full w-full hover-scroll main-content-scroll">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Super Admin Dashboard</h2>
            <div className="p-4 border rounded-md">
              <p>Welcome to the super admin dashboard. This section is under development.</p>
            </div>
          </div>
        </ScrollArea>
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default SuperAdminDashboard;
