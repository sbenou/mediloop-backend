
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Grid, List } from "lucide-react";
import { useState } from "react";

export const CustomersCard = () => {
  const [viewType, setViewType] = useState<"list" | "grid">("list");
  
  // Mocked data - in a real app, this would come from backend
  const mockCustomers = [
    { id: 1, name: "Dr. John Smith", role: "doctor", email: "john.smith@example.com" },
    { id: 2, name: "Dr. Sarah Johnson", role: "doctor", email: "sarah.johnson@example.com" },
    { id: 3, name: "PharmaCorp Inc.", role: "pharmacist", email: "contact@pharmacorp.com" },
    { id: 4, name: "HealthMeds Pharmacy", role: "pharmacist", email: "info@healthmeds.com" },
    { id: 5, name: "Dr. Michael Wong", role: "doctor", email: "mwong@mediclinic.com" },
  ];
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Customers</CardTitle>
          <Tabs 
            value={viewType}
            onValueChange={(val) => setViewType(val as "list" | "grid")}
            className="w-auto"
          >
            <TabsList className="grid grid-cols-2 w-[120px]">
              <TabsTrigger value="list" className="flex items-center gap-1">
                <List className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:text-xs">List</span>
              </TabsTrigger>
              <TabsTrigger value="grid" className="flex items-center gap-1">
                <Grid className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:text-xs">Grid</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <TabsContent value="list" className="mt-0">
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-2 font-medium">Name</th>
                  <th className="p-2 font-medium">Role</th>
                  <th className="p-2 font-medium">Email</th>
                </tr>
              </thead>
              <tbody>
                {mockCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b">
                    <td className="p-2">{customer.name}</td>
                    <td className="p-2 capitalize">{customer.role}</td>
                    <td className="p-2">{customer.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        
        <TabsContent value="grid" className="mt-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mockCustomers.map((customer) => (
              <div key={customer.id} className="rounded-lg border p-4 hover:bg-accent transition-colors">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{customer.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{customer.role}</p>
                    <p className="text-sm mt-1">{customer.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </CardContent>
    </Card>
  );
};

export default CustomersCard;
