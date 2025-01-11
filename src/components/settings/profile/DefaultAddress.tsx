import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Address } from "../types";

export const DefaultAddress = () => {
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

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading address...</div>;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Default Address</h3>
      {defaultAddress ? (
        <>
          <p className="text-base">{defaultAddress.street}</p>
          <p className="text-base">
            {defaultAddress.city}, {defaultAddress.postal_code}
          </p>
          <p className="text-base">{defaultAddress.country}</p>
          <p className="text-sm text-gray-500 mt-2">
            To update your address, please use the Addresses tab.
          </p>
        </>
      ) : (
        <div className="text-sm text-gray-500">
          No default address set. Please add an address in the Addresses tab.
        </div>
      )}
    </div>
  );
};