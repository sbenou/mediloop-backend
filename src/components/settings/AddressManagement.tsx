import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddressForm from "./AddressForm";
import AddressList from "./AddressList";
import { Address } from "./types";

const AddressManagement = () => {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
  });

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', session.user.id)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      return data as Address[];
    },
    enabled: !!session?.user?.id,
  });

  if (!session?.user?.id) {
    return <div>Please log in to manage your addresses.</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Address</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressForm 
            userId={session.user.id}
            onSuccess={() => {}}
            existingAddresses={addresses || []}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Addresses</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading addresses...</div>
          ) : (
            <AddressList 
              addresses={addresses || []} 
              userId={session.user.id}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AddressManagement;