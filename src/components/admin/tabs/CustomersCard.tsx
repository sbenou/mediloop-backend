
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, Grid3X3, List, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const CustomersCard = () => {
  const [displayMode, setDisplayMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "doctor" | "pharmacist">("all");

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .not('deleted_at', 'is', null)
        .in('role', ['doctor', 'pharmacist']);

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching customers:", error);
        return [];
      }
      
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const filteredCustomers = customers?.filter((customer) => {
    const matchesSearch = !searchQuery || 
      customer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "all" || customer.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search customers..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4 items-center">
              <RadioGroup 
                defaultValue="all"
                className="flex gap-4" 
                value={roleFilter}
                onValueChange={(value) => setRoleFilter(value as any)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="filter-all" />
                  <Label htmlFor="filter-all">All</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="doctor" id="filter-doctor" />
                  <Label htmlFor="filter-doctor">Doctors</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pharmacist" id="filter-pharmacist" />
                  <Label htmlFor="filter-pharmacist">Pharmacists</Label>
                </div>
              </RadioGroup>
              
              <div className="flex border rounded-md">
                <Button 
                  variant={displayMode === "grid" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setDisplayMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button 
                  variant={displayMode === "list" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setDisplayMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className={displayMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
              : "space-y-4"
            }>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className={displayMode === "grid" 
                  ? "h-48 w-full" 
                  : "h-16 w-full"
                } />
              ))}
            </div>
          ) : displayMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers?.map((customer) => (
                <Card key={customer.id} className="overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{customer.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                      </div>
                      <Badge variant={customer.role === "doctor" ? "default" : "secondary"}>
                        {customer.role}
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-2">
                      {customer.license_number && (
                        <p className="text-xs">License: {customer.license_number}</p>
                      )}
                      {customer.city && (
                        <p className="text-xs">Location: {customer.city}</p>
                      )}
                      <p className="text-xs">Customer since: {new Date(customer.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="bg-muted p-2 flex justify-end">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCustomers?.map((customer) => (
                <div 
                  key={customer.id} 
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{customer.full_name}</p>
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={customer.role === "doctor" ? "default" : "secondary"}>
                      {customer.role}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
