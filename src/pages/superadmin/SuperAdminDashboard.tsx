import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminTabs } from "@/components/admin/tabs/AdminTabs";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAdminData } from "@/hooks/admin/useAdminData";
import BankHolidayManager from "@/components/admin/BankHolidayManager";
import { Link } from "react-router-dom";
import { RoleManagementTable } from "@/components/admin/RoleManagementTable";

const legacySupabaseAdminTabs =
  import.meta.env.VITE_SUPABASE_ADMIN_TABS === "true";

const SuperAdminDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { users, isLoading: adminDataLoading, updateUserRole } = useAdminData(
    profile ?? null,
  );

  if (!profile || profile.role !== "superadmin") {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this area. This dashboard is
              only for superadmin users.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Super Admin Dashboard</CardTitle>
          <CardDescription>
            Manage all aspects of the healthcare platform
          </CardDescription>
          <p className="text-sm pt-2">
            <Link
              to="/superadmin/legacy-clinical"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Legacy clinical review (Phase 5A)
            </Link>
            {" — "}
            read-only attribution / legacy row list
          </p>
          <p className="text-sm pt-1">
            <Link
              to="/superadmin/rotation-queue"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Token rotation queue health
            </Link>
            {" — "}
            inspect retries and last errors for scheduled token rotations
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="bank-holidays">Bank Holidays</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AdminTabs
            tabBasePath="/superadmin/dashboard"
            legacySupabaseAdminTabs={legacySupabaseAdminTabs}
            users={users}
            isLoading={adminDataLoading}
            updateUserRole={updateUserRole}
          />
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage all users in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>User management interface will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <RoleManagementTable />
        </TabsContent>

        <TabsContent value="bank-holidays">
          <BankHolidayManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminDashboard;

