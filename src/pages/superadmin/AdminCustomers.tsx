
import React, { useState } from "react";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Grid, List, Search, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

type CustomerViewType = "list" | "card";

interface Customer {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  license_number: string | null;
  created_at: string;
}

const AdminCustomers = () => {
  const [viewType, setViewType] = useState<CustomerViewType>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pharmacist" | "doctor">("all");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["admin-customers", activeTab],
    queryFn: async () => {
      // Make query based on active tab
      let query = supabase
        .from("profiles")
        .select("*")
        .is("deleted_at", null);

      if (activeTab === "pharmacist") {
        query = query.eq("role", "pharmacist");
      } else if (activeTab === "doctor") {
        query = query.eq("role", "doctor");
      } else {
        query = query.in("role", ["pharmacist", "doctor"]);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Customer[];
    },
  });

  const filteredCustomers = customers.filter(customer => 
    customer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.license_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Customers</h1>
          <div className="flex space-x-2">
            <Button 
              variant={viewType === "list" ? "default" : "outline"} 
              size="icon"
              onClick={() => setViewType("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewType === "card" ? "default" : "outline"} 
              size="icon"
              onClick={() => setViewType("card")}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as "all" | "pharmacist" | "doctor")}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pharmacist">Pharmacists</TabsTrigger>
              <TabsTrigger value="doctor">Doctors</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[250px]"
            />
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        ) : filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-medium mb-2">No customers found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try a different search query" : "Start adding customers to your platform"}
              </p>
            </CardContent>
          </Card>
        ) : viewType === "list" ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={customer.avatar_url || undefined} />
                          <AvatarFallback>{customer.full_name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <span>{customer.full_name}</span>
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs 
                          ${customer.role === 'doctor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {customer.role}
                        </span>
                      </TableCell>
                      <TableCell>{customer.license_number || "N/A"}</TableCell>
                      <TableCell>{customer.created_at ? format(new Date(customer.created_at), 'MMM d, yyyy') : "Unknown"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" title="Email customer">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Call customer">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Avatar className="h-20 w-20 mb-4">
                      <AvatarImage src={customer.avatar_url || undefined} />
                      <AvatarFallback className="text-xl">{customer.full_name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-medium text-lg">{customer.full_name}</h3>
                    <p className="text-muted-foreground mb-2">{customer.email}</p>
                    <div className={`px-2 py-1 rounded-full text-xs mb-4
                      ${customer.role === 'doctor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {customer.role}
                    </div>
                    
                    {customer.license_number && (
                      <p className="text-sm mt-2">
                        <span className="font-medium">License:</span> {customer.license_number}
                      </p>
                    )}
                    
                    <p className="text-sm mt-1">
                      <span className="font-medium">Joined:</span> {customer.created_at ? format(new Date(customer.created_at), 'MMM d, yyyy') : "Unknown"}
                    </p>
                    
                    <div className="flex space-x-2 mt-4">
                      <Button variant="outline" size="sm" className="w-full">
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default AdminCustomers;
