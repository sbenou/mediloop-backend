
import { useState, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { searchAddressesByQuery } from "@/services/address-service";

export const useAddressSuggestions = (form: UseFormReturn<any>, prefix = "") => {
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streetInputRef = useRef<HTMLElement | null>(null);

  // Handle street address input changes with debounce
  const handleStreetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    
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
      if (query.length === 0) {
        setShowSuggestions(false);
      }
    }
  };

  // Search for addresses
  const searchAddresses = async (query: string) => {
    try {
      console.log('Executing address search for:', query);
      const results = await searchAddressesByQuery(query);
      console.log('Address suggestions received:', results);
      setSuggestions(results);
    } catch (error) {
      console.error("Error searching addresses:", error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Get the correct field path based on prefix
  const getFieldName = (field: string) => prefix ? `${prefix}.${field}` : field;

  // Handle address suggestion selection
  const handleAddressSelect = (address: any) => {
    console.log('Selected address:', address);
    
    form.setValue(getFieldName('street'), address.street || '', { shouldValidate: true });
    form.setValue(getFieldName('city'), address.city || '', { shouldValidate: true });
    form.setValue(getFieldName('postal_code'), address.postal_code || '', { shouldValidate: true });
    form.setValue(getFieldName('country'), address.country || '', { shouldValidate: true });
    
    setShowSuggestions(false);
  };

  // Handle clicking outside to close suggestions
  const handleDocumentClick = (e: MouseEvent) => {
    if (showSuggestions && streetInputRef.current && !streetInputRef.current.contains(e.target as Node)) {
      setShowSuggestions(false);
    }
  };

  return {
    isSearching,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    searchTimeoutRef,
    streetInputRef,
    handleStreetInputChange,
    handleAddressSelect,
    handleDocumentClick
  };
};
