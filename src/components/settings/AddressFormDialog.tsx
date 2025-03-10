
import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { AddressType } from "./types";
import { MapPin, Loader2 } from "lucide-react";
import { confirmMapboxAddress, loadMapboxSearchSDK } from "@/services/address-service";
import MapboxAutofillInput from "../address/MapboxAutofillInput";
import MapboxMinimap from "../address/MapboxMinimap";

interface AddressFormDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingAddresses: any[];
}

const AddressFormDialog = ({ userId, open, onOpenChange, existingAddresses }: AddressFormDialogProps) => {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    postal_code: "",
    country: "",
    type: "secondary" as AddressType,
    is_default: false
  });
  
  const [showMinimap, setShowMinimap] = useState(false);
  const [minimapFeature, setMinimapFeature] = useState<any>(null);
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMapboxLoaded, setIsMapboxLoaded] = useState(false);

  // Preload Mapbox SDK as soon as component mounts
  useEffect(() => {
    // Start loading Mapbox SDK immediately
    loadMapboxSearchSDK()
      .then(() => {
        console.log("Mapbox SDK loaded successfully for AddressFormDialog");
        setIsMapboxLoaded(true);
      })
      .catch(error => {
        console.error("Failed to load Mapbox SDK for AddressFormDialog:", error);
        // Set loaded state to true anyway to allow the form to be usable
        setIsMapboxLoaded(true);
      });
  }, []);

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
      setShowMinimap(false);
      setMinimapFeature(null);
      setIsAddressConfirmed(false);
      setIsProcessing(false);
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

  const handleAddressSelected = (feature: any) => {
    console.log("Address selected:", feature);
    
    setMinimapFeature(feature);
    setShowMinimap(true);
    
    const properties = feature.properties || {};
    const address = properties.address || {};
    
    if (formRef.current) {
      setNewAddress(prev => ({
        ...prev,
        street: address.street || address.name || '',
        city: address.place || address.locality || '',
        postal_code: address.postcode || '',
        country: address.country || ''
      }));
    }
  };

  const handleLocationChange = (feature: any) => {
    console.log("Location changed on map:", feature);
    setMinimapFeature(feature);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formRef.current) return;
    
    setIsProcessing(true);
    
    if (isAddressConfirmed) {
      submitAddressToDatabase();
      return;
    }
    
    try {
      const result = await confirmMapboxAddress(formRef.current, true);
      console.log("Address confirmation result:", result);
      
      if (result.type === 'accepted') {
        toast({
          title: "Address Confirmed",
          description: "Using the suggested address."
        });
        setIsAddressConfirmed(true);
        
        const formData = new FormData(formRef.current);
        setNewAddress(prev => ({
          ...prev,
          street: formData.get('street-address')?.toString() || prev.street,
          city: formData.get('address-level2')?.toString() || prev.city,
          postal_code: formData.get('postal-code')?.toString() || prev.postal_code,
          country: formData.get('country')?.toString() || prev.country,
        }));
        
        submitAddressToDatabase();
      } else if (result.type === 'rejected') {
        toast({
          title: "Using Original Address",
          description: "Continuing with the address you entered."
        });
        setIsAddressConfirmed(true);
        submitAddressToDatabase();
      } else {
        setIsAddressConfirmed(true);
        submitAddressToDatabase();
      }
    } catch (error) {
      console.error("Error confirming address:", error);
      submitAddressToDatabase();
    } finally {
      setIsProcessing(false);
    }
  };

  const submitAddressToDatabase = () => {
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const finalAddress = {
        street: formData.get('street-address')?.toString() || newAddress.street,
        city: formData.get('address-level2')?.toString() || newAddress.city,
        postal_code: formData.get('postal-code')?.toString() || newAddress.postal_code,
        country: formData.get('country')?.toString() || newAddress.country,
        type: newAddress.type,
        is_default: newAddress.is_default
      };
      
      addAddressMutation.mutate(finalAddress);
    } else {
      addAddressMutation.mutate(newAddress);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Address</DialogTitle>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street-address">Street Address</Label>
            <div className="relative">
              <MapboxAutofillInput
                formRef={formRef}
                placeholder="Start typing your address..."
                required
                className="pr-10"
                onAddressSelected={handleAddressSelected}
                autoFocus={true}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                tabIndex={-1}
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showMinimap && minimapFeature && (
            <div className="space-y-2">
              <Label>Confirm Location</Label>
              <MapboxMinimap 
                feature={minimapFeature} 
                height="200px"
                onLocationChange={handleLocationChange}
              />
              <p className="text-xs text-muted-foreground">
                Drag the pin to adjust the exact location if needed.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="address-level2">City</Label>
            <Input
              id="address-level2"
              name="address-level2"
              value={newAddress.city}
              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
              autoComplete="address-level2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postal-code">Postal Code</Label>
            <Input
              id="postal-code"
              name="postal-code"
              value={newAddress.postal_code}
              onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
              autoComplete="postal-code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              name="country"
              value={newAddress.country}
              onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
              autoComplete="country"
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing || addAddressMutation.isPending}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : addAddressMutation.isPending ? (
                "Adding..."
              ) : (
                "Add Address"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddressFormDialog;
