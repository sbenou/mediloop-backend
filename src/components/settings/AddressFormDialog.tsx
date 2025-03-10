
import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { MapPin } from "lucide-react";
import AddressSearchDialog from "../address/AddressSearchDialog";

interface AddressFormDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingAddresses: any[];
}

const AddressFormDialog = ({ userId, open, onOpenChange, existingAddresses }: AddressFormDialogProps) => {
  const queryClient = useQueryClient();
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    postal_code: "",
    country: "",
    type: "secondary" as AddressType,
    is_default: false
  });
  const [addressSearchOpen, setAddressSearchOpen] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setNewAddress({
        street: "",
        city: "",
        postal_code: "",
        country: "",
        type: "secondary",
        is_default: false
      });
    }
  }, [open]);

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
      toast({
        title: "Address Added",
        description: "Your new address has been added successfully.",
      });
      onOpenChange(false);
    },
  });

  const handleAddressSelect = (address: string) => {
    // Parse the formatted address into components
    const addressParts = address.split(', ');
    
    let street = addressParts[0] || '';
    let city = '';
    let postalCode = '';
    let country = '';
    
    // Extract postal code (usually in format "12345")
    const postalCodeMatch = address.match(/\b\d{5}\b/);
    if (postalCodeMatch) {
      postalCode = postalCodeMatch[0];
    }
    
    // If we have enough parts, try to extract city and country
    if (addressParts.length > 1) {
      // Usually city is the second part
      city = addressParts[1] || '';
      
      // Country is usually the last part
      if (addressParts.length > 2) {
        country = addressParts[addressParts.length - 1] || '';
      }
    }
    
    setNewAddress({
      ...newAddress,
      street,
      city,
      postal_code: postalCode,
      country
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAddressMutation.mutate(newAddress);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <div className="relative flex">
                <Input
                  id="street"
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  placeholder="Enter street address"
                  className="pr-10"
                  readOnly
                  onClick={() => setAddressSearchOpen(true)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setAddressSearchOpen(true)}
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
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

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addAddressMutation.isPending}>
                {addAddressMutation.isPending ? "Adding..." : "Add Address"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Address Search Dialog */}
      <AddressSearchDialog
        open={addressSearchOpen}
        onOpenChange={setAddressSearchOpen}
        onSelectAddress={handleAddressSelect}
        initialValue={newAddress.street}
      />
    </>
  );
};

export default AddressFormDialog;
