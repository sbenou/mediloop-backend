
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PharmacySettingsView = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pharmacy Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Settings & Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Manage your pharmacy settings and configurations here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PharmacySettingsView;
