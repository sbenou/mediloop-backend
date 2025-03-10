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
import { MapPin, Loader2 } from "lucide-react";
import { Command, CommandList, CommandItem, CommandGroup } from "@/components/ui/command";
import { searchAddressesByQuery } from "@/services/address-service";

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
  
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [open]);

  // Handle focus on the street input field
  useEffect(() => {
    if (open && inputRef.current) {
      // Slight delay to ensure dialog is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Handle street address input changes with debounce
  const handleStreetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setNewAddress({ ...newAddress, street: query });
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (query && query.length >= 3) {
      setIsSearching(true);
      setShowSuggestions(true);
      
      searchTimeoutRef.current = setTimeout(() => {
        searchAddresses(query);
      }, 300); // 300ms debounce time
    } else {
      setSuggestions([]);
      setIsSearching(false);
      setShowSuggestions(false);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (newAddress.street.length >= 3) {
      setShowSuggestions(true);
      if (suggestions.length === 0 && !isSearching) {
        searchAddresses(newAddress.street);
      }
    }
  };

  // Search for addresses
  const searchAddresses = async (query: string) => {
    try {
      console.log('Executing address search for query:', query);
      setIsSearching(true);
      
      const results = await searchAddressesByQuery(query);
      console.log('Address suggestions received:', results);
      setSuggestions(results);
      setIsSearching(false);
      
      // Keep showing suggestions only if we have results or are still searching
      setShowSuggestions(results.length > 0 || isSearching);
    } catch (error) {
      console.error("Error searching addresses:", error);
      setSuggestions([]);
      setIsSearching(false);
      setShowSuggestions(false);
    }
  };

  // Handle clicking outside the suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle address suggestion selection
  const handleAddressSelect = (address: any) => {
    // Parse the formatted address into components
    setNewAddress({
      ...newAddress,
      street: address.street || '',
      city: address.city || '',
      postal_code: address.postal_code || '',
      country: address.country || ''
    });
    
    setShowSuggestions(false);
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
      toast({
        title: "Address Added",
        description: "Your new address has been added successfully.",
      });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAddressMutation.mutate(newAddress);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Address</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <div className="relative">
              <Input
                id="street"
                ref={inputRef}
                value={newAddress.street}
                onChange={handleStreetChange}
                onFocus={handleInputFocus}
                placeholder="Start typing your street address"
                className="pr-10"
                required
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
              
              {showSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                  {isSearching ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Searching addresses...</span>
                    </div>
                  ) : (
                    <Command className="w-full">
                      <CommandList>
                        <CommandGroup>
                          {suggestions.length > 0 ? (
                            suggestions.map((address, index) => (
                              <CommandItem
                                key={index}
                                onSelect={() => handleAddressSelect(address)}
                                className="cursor-pointer"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{address.street}</span>
                                  <span className="text-xs text-gray-500">
                                    {[address.city, address.postal_code, address.country]
                                      .filter(Boolean)
                                      .join(', ')}
                                  </span>
                                </div>
                              </CommandItem>
                            ))
                          ) : (
                            <div className="p-4 text-sm text-gray-500 text-center">
                              {newAddress.street.length >= 3 
                                ? 'No suggestions found. Try adding more details.' 
                                : 'Type at least 3 characters to search'}
                            </div>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  )}
                </div>
              )}
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
  );
};

export default AddressFormDialog;
