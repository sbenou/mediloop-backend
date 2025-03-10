
import { useState, useEffect } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem, CommandGroup } from "@/components/ui/command";
import { searchAddressesByQuery } from "@/services/address-service";

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
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (addressQuery && addressQuery.length > 2) {
        searchAddresses(addressQuery);
      } else {
        setAddressSuggestions([]);
        setIsPopoverOpen(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [addressQuery]);

  const searchAddresses = async (query: string) => {
    if (query.length < 3) return;
    
    try {
      setIsSearching(true);
      const suggestions = await searchAddressesByQuery(query);
      console.log('Address suggestions:', suggestions);
      setAddressSuggestions(suggestions);
      setIsPopoverOpen(suggestions.length > 0);
    } catch (error) {
      console.error('Error searching for addresses:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddressSelect = (address: any) => {
    setNewAddress({
      ...newAddress,
      street: address.street,
      city: address.city,
      postal_code: address.postal_code,
      country: address.country
    });
    setAddressQuery(address.street);
    setIsPopoverOpen(false);
  };

  const handleStreetChange = (value: string) => {
    setAddressQuery(value);
    setNewAddress({ ...newAddress, street: value });
  };

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
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <div>
              <Input
                id="street"
                value={addressQuery}
                onChange={(e) => handleStreetChange(e.target.value)}
                placeholder="Start typing your street address"
                className="w-full"
                required
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-full" align="start">
            <Command>
              <CommandList>
                {isSearching ? (
                  <div className="flex items-center justify-center p-2">
                    <div className="animate-spin h-4 w-4 rounded-full border-2 border-gray-900 border-opacity-25 border-t-gray-600"></div>
                    <span className="ml-2 text-sm">Searching...</span>
                  </div>
                ) : (
                  <CommandGroup heading="Address suggestions">
                    {addressSuggestions.map((address, index) => (
                      <CommandItem
                        key={index}
                        onSelect={() => handleAddressSelect(address)}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{address.street}</span>
                          <span className="text-xs text-gray-500">
                            {[address.postal_code, address.city, address.country]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                    {addressSuggestions.length === 0 && addressQuery.length >= 3 && !isSearching && (
                      <div className="p-2 text-sm text-gray-500">
                        No suggestions found
                      </div>
                    )}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
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
