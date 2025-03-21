
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PharmacyProfileView = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pharmacy Profile</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Pharmacy Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Your pharmacy profile management page will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PharmacyProfileView;
