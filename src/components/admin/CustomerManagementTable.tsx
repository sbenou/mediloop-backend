
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, UserCog } from "lucide-react";
import { UserProfile } from "@/types/user";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CustomerManagementTableProps {
  customers?: UserProfile[];
  isLoading: boolean;
  updateUserRole: (userId: string, newRole: UserProfile['role']) => Promise<void>;
}

export const CustomerManagementTable = ({ customers = [], isLoading, updateUserRole }: CustomerManagementTableProps) => {
  const [viewType, setViewType] = useState<"list" | "card">("list");
  
  // Filter doctors and pharmacists
  const doctors = customers.filter(customer => customer.role === 'doctor');
  const pharmacists = customers.filter(customer => customer.role === 'pharmacist');

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Customer Management</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewType === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewType("list")}
          >
            List View
          </Button>
          <Button
            variant={viewType === "card" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewType("card")}
          >
            Card View
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Customers ({customers.length})</TabsTrigger>
            <TabsTrigger value="doctors">Doctors ({doctors.length})</TabsTrigger>
            <TabsTrigger value="pharmacists">Pharmacists ({pharmacists.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {viewType === "list" ? (
              <CustomersListView 
                customers={customers} 
                updateUserRole={updateUserRole} 
              />
            ) : (
              <CustomersCardView 
                customers={customers}
              />
            )}
          </TabsContent>
          
          <TabsContent value="doctors">
            {viewType === "list" ? (
              <CustomersListView 
                customers={doctors} 
                updateUserRole={updateUserRole} 
              />
            ) : (
              <CustomersCardView 
                customers={doctors}
              />
            )}
          </TabsContent>
          
          <TabsContent value="pharmacists">
            {viewType === "list" ? (
              <CustomersListView 
                customers={pharmacists} 
                updateUserRole={updateUserRole} 
              />
            ) : (
              <CustomersCardView 
                customers={pharmacists}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const CustomersListView = ({ 
  customers, 
  updateUserRole 
}: { 
  customers: UserProfile[],
  updateUserRole: (userId: string, newRole: UserProfile['role']) => Promise<void>
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>License Number</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-4">
              No customers found
            </TableCell>
          </TableRow>
        ) : (
          customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.full_name}</TableCell>
              <TableCell>{customer.email}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {customer.role}
                </Badge>
              </TableCell>
              <TableCell>{customer.license_number || "N/A"}</TableCell>
              <TableCell>
                <Badge variant={customer.is_blocked ? "destructive" : "success"}>
                  {customer.is_blocked ? "Blocked" : "Active"}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

const CustomersCardView = ({ 
  customers 
}: { 
  customers: UserProfile[] 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {customers.length === 0 ? (
        <div className="col-span-full text-center py-8">
          No customers found
        </div>
      ) : (
        customers.map((customer) => (
          <Card key={customer.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{customer.full_name}</h3>
                <Badge variant="outline" className="capitalize my-2">
                  {customer.role}
                </Badge>
                <div className="flex items-center mt-1 text-muted-foreground">
                  <Mail className="h-4 w-4 mr-1" />
                  <span className="text-sm">{customer.email}</span>
                </div>
                {customer.license_number && (
                  <div className="flex items-center mt-1 text-muted-foreground">
                    <UserCog className="h-4 w-4 mr-1" />
                    <span className="text-sm">License: {customer.license_number}</span>
                  </div>
                )}
                <div className="mt-4">
                  <Badge variant={customer.is_blocked ? "destructive" : "success"}>
                    {customer.is_blocked ? "Blocked" : "Active"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
