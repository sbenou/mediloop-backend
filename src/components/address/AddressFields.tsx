
import React, { useState, useEffect, useRef } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import { Command, CommandList, CommandGroup, CommandItem } from "@/components/ui/command";
import { UseFormReturn } from "react-hook-form";
import { useAddressSuggestions } from "@/hooks/useAddressSuggestions";

interface AddressFieldsProps {
  form: UseFormReturn<any>;
  prefix?: string; // For nested fields, e.g., "nextOfKin" for "nextOfKin.street"
  disabled?: boolean;
}

const AddressFields = ({ form, prefix = "", disabled = false }: AddressFieldsProps) => {
  const {
    suggestions,
    isSearching,
    showSuggestions,
    setShowSuggestions,
    handleStreetInputChange,
    handleAddressSelect,
    handleDocumentClick
  } = useAddressSuggestions(form, prefix);

  const streetInputRef = useRef<HTMLInputElement>(null);

  // Handle document click to close suggestions
  useEffect(() => {
    if (showSuggestions) {
      document.addEventListener('click', handleDocumentClick);
    }
    
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [showSuggestions, handleDocumentClick]);

  // Field names with prefix handling
  const getFieldName = (field: string) => prefix ? `${prefix}.${field}` : field;
  const streetField = getFieldName('street');
  const cityField = getFieldName('city');
  const postalCodeField = getFieldName('postal_code');
  const countryField = getFieldName('country');

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={streetField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Street</FormLabel>
            <div className="relative">
              <FormControl>
                <Input 
                  {...field}
                  ref={streetInputRef}
                  onChange={(e) => {
                    field.onChange(e);
                    handleStreetInputChange(e);
                  }}
                  placeholder="Street address" 
                  className="pr-10"
                  disabled={disabled}
                  autoComplete="off"
                />
              </FormControl>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                tabIndex={-1}
                disabled={disabled}
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
                              {field.value && field.value.length >= 3 
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
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={cityField}
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input {...field} placeholder="City" disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={postalCodeField}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postal Code</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Postal Code" disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name={countryField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Country</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Country" disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default AddressFields;
