
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const InventoryView = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pharmacy Inventory</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Your pharmacy inventory management dashboard will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryView;
