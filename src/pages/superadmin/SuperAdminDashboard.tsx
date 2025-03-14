
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminTabs } from "@/components/admin/tabs/AdminTabs";
import { useAuth } from "@/hooks/auth/useAuth";
import BankHolidayManager from "@/components/admin/BankHolidayManager";

const SuperAdminDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!profile || profile.role !== 'superadmin') {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this area. This dashboard is only for superadmin users.
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
          <AdminTabs />
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage all users in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <p>User management interface will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
              <CardDescription>Manage roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Role management interface will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank-holidays">
          <BankHolidayManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminDashboard;
