
import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command, CommandList, CommandItem, CommandGroup } from "@/components/ui/command";
import { searchAddressesByQuery } from "@/services/address-service";
import { Loader2 } from "lucide-react";

interface AddressSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAddress: (address: string) => void;
  initialValue?: string;
}

const AddressSearchDialog = ({ 
  open, 
  onOpenChange, 
  onSelectAddress,
  initialValue = ""
}: AddressSearchDialogProps) => {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      // Slight delay to ensure dialog is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  // Handle search query changes with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (searchQuery && searchQuery.length >= 3) {
      setIsSearching(true);
      
      searchTimeoutRef.current = setTimeout(() => {
        searchAddresses(searchQuery);
      }, 300); // 300ms debounce time
    } else {
      setSuggestions([]);
      setIsSearching(false);
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Search for addresses
  const searchAddresses = async (query: string) => {
    try {
      console.log('Executing address search for:', query);
      const results = await searchAddressesByQuery(query);
      console.log('Address suggestions received:', results.length);
      setSuggestions(results);
    } catch (error) {
      console.error("Error searching addresses:", error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle address selection
  const handleAddressSelect = (address: any) => {
    onSelectAddress(address.formatted);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search Address</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="relative">
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Start typing your address..."
              className="pr-10"
              autoComplete="off"
            />
          </div>
          
          <div className="relative border rounded-md max-h-60 overflow-auto">
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
                        {searchQuery.length >= 3 
                          ? 'No suggestions found. Try adding more details.' 
                          : 'Type at least 3 characters to search'}
                      </div>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddressSearchDialog;
