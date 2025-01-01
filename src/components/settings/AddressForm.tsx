import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { AddressType } from "./types";

interface AddressFormProps {
  userId: string;
  onSuccess: () => void;
  existingAddresses: any[];
}

const AddressForm = ({ userId, onSuccess, existingAddresses }: AddressFormProps) => {
  const queryClient = useQueryClient();
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    postal_code: "",
    country: "",
    type: "secondary" as AddressType,
    is_default: false
  });

  const addAddressMutation = useMutation({
    mutationFn: async (address: typeof newAddress) => {
      const addressToInsert = {
        ...address,
        user_id: userId,
        is_default: !existingAddresses?.length || address.is_default
      };

      const { error } = await supabase
        .from('addresses')
        .insert([addressToInsert]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setNewAddress({
        street: "",
        city: "",
        postal_code: "",
        country: "",
        type: "secondary",
        is_default: false
      });
      toast({
        title: "Address Added",
        description: "Your new address has been added successfully.",
      });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAddressMutation.mutate(newAddress);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="street">Street Address</Label>
        <Input
          id="street"
          value={newAddress.street}
          onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          value={newAddress.city}
          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="postal_code">Postal Code</Label>
        <Input
          id="postal_code"
          value={newAddress.postal_code}
          onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Input
          id="country"
          value={newAddress.country}
          onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Address Type</Label>
        <Select
          value={newAddress.type}
          onValueChange={(value: AddressType) => setNewAddress({ ...newAddress, type: value })}
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

      <Button type="submit" disabled={addAddressMutation.isPending}>
        {addAddressMutation.isPending ? "Adding..." : "Add Address"}
      </Button>
    </form>
  );
};

export default AddressForm;