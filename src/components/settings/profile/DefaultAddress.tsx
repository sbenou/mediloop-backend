import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Address } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams, useNavigate } from "react-router-dom";

export const DefaultAddress = () => {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  
  const { data: defaultAddress, isLoading } = useQuery({
    queryKey: ['default-address'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();
      
      if (error) throw error;
      return data as Address;
    },
  });

  const handleManageAddresses = () => {
    setSearchParams({ tab: 'addresses' });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading address...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Default Address</h3>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleManageAddresses}
            >
              Manage Addresses
            </Button>
          </div>

          {defaultAddress ? (
            <div className="space-y-2 pl-7">
              <p className="text-base">{defaultAddress.street}</p>
              <p className="text-base">
                {defaultAddress.city}, {defaultAddress.postal_code}
              </p>
              <p className="text-base">{defaultAddress.country}</p>
              <p className="text-sm text-muted-foreground mt-2">
                To update your address, please use the Addresses tab.
              </p>
            </div>
          ) : (
            <div className="pl-7 py-4">
              <p className="text-sm text-muted-foreground">
                No default address set. Please add an address in the Addresses tab.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};