import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type AddressType = "main" | "secondary" | "work";

interface Address {
  id: string;
  user_id: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  type: AddressType;
  is_default: boolean;
}

const AddressManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAddress, setNewAddress] = useState<Omit<Address, 'id' | 'user_id'>>({
    street: "",
    city: "",
    postal_code: "",
    country: "",
    type: "secondary",
    is_default: false
  });

  // Get the current user's ID
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
    enabled: !!session?.user?.id, // Only run query if we have a user ID
  });

  const addAddressMutation = useMutation({
    mutationFn: async (address: Omit<Address, 'id' | 'user_id'>) => {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      const addressToInsert = {
        ...address,
        user_id: session.user.id,
        is_default: !addresses?.length || address.is_default
      };

      const { data, error } = await supabase
        .from('addresses')
        .insert([addressToInsert])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setIsAddingNew(false);
      setNewAddress({
        street: "",
        city: "",
        postal_code: "",
        country: "",
        type: "secondary",
        is_default: false
      });
      toast({
        title: "Address added",
        description: "Your new address has been added successfully.",
      });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', session.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast({
        title: "Address deleted",
        description: "The address has been deleted successfully.",
      });
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      const { error: updateError } = await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', session.user.id)
        .neq('id', addressId);

      if (updateError) throw updateError;

      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .eq('user_id', session.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast({
        title: "Default address updated",
        description: "Your default address has been updated successfully.",
      });
    },
  });

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    addAddressMutation.mutate(newAddress);
  };

  if (isLoading) {
    return <div>Loading addresses...</div>;
  }

  return (
    <div className="space-y-6">
      {addresses?.map((address) => (
        <Card key={address.id} className="p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{address.type.charAt(0).toUpperCase() + address.type.slice(1)} Address</h3>
                {address.is_default && (
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{address.street}</p>
              <p className="text-sm text-muted-foreground">
                {address.city}, {address.postal_code}
              </p>
              <p className="text-sm text-muted-foreground">{address.country}</p>
            </div>
            <div className="flex gap-2">
              {!address.is_default && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDefaultAddressMutation.mutate(address.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deleteAddressMutation.mutate(address.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}

      {isAddingNew ? (
        <form onSubmit={handleAddAddress} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={newAddress.street}
                onChange={(e) => setNewAddress(prev => ({ ...prev, street: e.target.value }))}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={newAddress.postal_code}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={newAddress.country}
                onChange={(e) => setNewAddress(prev => ({ ...prev, country: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Address Type</Label>
              <Select
                value={newAddress.type}
                onValueChange={(value: AddressType) => 
                  setNewAddress(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select address type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit">Save Address</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddingNew(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button onClick={() => setIsAddingNew(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Address
        </Button>
      )}
    </div>
  );
};

export default AddressManagement;