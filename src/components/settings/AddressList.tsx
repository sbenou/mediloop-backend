import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Address } from "./types";
import { Star, Trash2 } from "lucide-react";

interface AddressListProps {
  addresses: Address[];
  userId: string;
}

const AddressList = ({ addresses, userId }: AddressListProps) => {
  const queryClient = useQueryClient();

  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast({
        title: "Address Deleted",
        description: "The address has been removed successfully.",
      });
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const { error: updateError } = await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .neq('id', addressId);

      if (updateError) throw updateError;

      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast({
        title: "Default Address Updated",
        description: "Your default address has been updated successfully.",
      });
    },
  });

  return (
    <div className="space-y-4">
      {addresses?.map((address) => (
        <div
          key={address.id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div>
            <div className="font-medium">
              {address.type.charAt(0).toUpperCase() + address.type.slice(1)} Address
              {address.is_default && (
                <span className="ml-2 text-sm text-primary">(Default)</span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {address.street}, {address.city}
            </div>
            <div className="text-sm text-gray-600">
              {address.postal_code}, {address.country}
            </div>
          </div>
          <div className="flex space-x-2">
            {!address.is_default && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDefaultAddressMutation.mutate(address.id)}
                disabled={setDefaultAddressMutation.isPending}
              >
                <Star className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => deleteAddressMutation.mutate(address.id)}
              disabled={deleteAddressMutation.isPending || address.is_default}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AddressList;