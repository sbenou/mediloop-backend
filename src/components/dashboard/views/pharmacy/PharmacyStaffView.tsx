
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PharmacyStaffView = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pharmacy Staff</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Staff Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Manage your pharmacy staff members here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PharmacyStaffView;
