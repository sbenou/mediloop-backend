
import { useState, useEffect, useRef } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandList, CommandItem, CommandGroup, CommandInput } from "@/components/ui/command";
import { searchAddressesByQuery } from "@/services/address-service";
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import flags from 'react-phone-number-input/flags';
import { cn } from "@/lib/utils";

interface PatientSectionProps {
  form: UseFormReturn<any>;
}

const PatientSection = ({ form }: PatientSectionProps) => {
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check phone validity on change
  useEffect(() => {
    if (phoneValue) {
      const valid = isValidPhoneNumber(phoneValue);
      setIsPhoneValid(valid);
      form.setValue('patientPhone', phoneValue, { 
        shouldValidate: true,
        shouldDirty: true 
      });
    }
  }, [phoneValue, form]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (addressQuery && addressQuery.length > 2) {
      setIsLoadingAddresses(true);
      setIsPopoverOpen(true);
      
      searchTimeoutRef.current = setTimeout(() => {
        searchAddresses(addressQuery);
      }, 800);
    } else {
      setAddressSuggestions([]);
      if (!addressQuery) {
        setIsPopoverOpen(false);
      }
      setIsLoadingAddresses(false);
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [addressQuery]);

  const searchAddresses = async (query: string) => {
    try {
      console.log('Executing search for:', query);
      const suggestions = await searchAddressesByQuery(query);
      console.log('Address suggestions received:', suggestions.length);
      setAddressSuggestions(suggestions);
      
      setIsPopoverOpen(true);
    } catch (error) {
      console.error("Error searching addresses:", error);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const selectAddress = (address: any) => {
    form.setValue('patientAddress', address.formatted);
    setAddressQuery(address.formatted);
    setIsPopoverOpen(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg text-primary">Patient Details</h3>
      <FormField
        control={form.control}
        name="patientName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Patient Name</FormLabel>
            <FormControl>
              <Input {...field} className="bg-accent/5" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="patientPhone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Patient Phone</FormLabel>
            <FormControl>
              <div className={cn(
                "flex rounded-md border border-input bg-accent/5 ring-offset-background focus-within:ring-1 focus-within:ring-primary",
                !isPhoneValid && phoneValue && "border-destructive focus-within:ring-destructive"
              )}>
                <PhoneInput
                  flags={flags}
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="LU"
                  value={phoneValue}
                  onChange={(value) => {
                    setPhoneValue(value || '');
                  }}
                  className="flex h-10 w-full rounded-md bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  countrySelectProps={{
                    unicodeFlags: true,
                    dropdownClass: "bg-popover text-popover-foreground shadow-md rounded-md border border-input overflow-hidden py-1.5",
                    buttonClass: "border-0 bg-transparent",
                    arrowClass: "opacity-50 w-3 h-3",
                    searchable: true, // Enable search
                    searchClass: "py-3 px-3 border-b mb-1",
                    searchPlaceholder: "Search for a country...",
                  }}
                />
              </div>
              {!isPhoneValid && phoneValue && (
                <p className="text-sm font-medium text-destructive mt-1">Please enter a valid phone number for the selected country</p>
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="patientAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Patient Address</FormLabel>
            <Popover open={isPopoverOpen} onOpenChange={(open) => {
              if (!open) setIsPopoverOpen(false);
            }}>
              <PopoverTrigger asChild>
                <div>
                  <Input 
                    value={addressQuery}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      setAddressQuery(e.target.value);
                    }}
                    onFocus={() => {
                      if (addressQuery && addressQuery.length > 2) {
                        setIsPopoverOpen(true);
                      }
                    }}
                    className="bg-accent/5" 
                    placeholder="Start typing an address..."
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[300px]" align="start">
                <Command>
                  <CommandList>
                    {isLoadingAddresses ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="animate-spin h-4 w-4 rounded-full border-2 border-gray-900 border-opacity-25 border-t-gray-600"></div>
                        <span className="ml-2 text-sm">Searching...</span>
                      </div>
                    ) : (
                      <CommandGroup heading="Address suggestions">
                        {addressSuggestions.length > 0 ? (
                          addressSuggestions.map((address, index) => (
                            <CommandItem
                              key={index}
                              onSelect={() => selectAddress(address)}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span>{address.formatted}</span>
                              </div>
                            </CommandItem>
                          ))
                        ) : (
                          <div className="p-4 text-sm text-gray-500">
                            {addressQuery.length >= 3 
                              ? 'No suggestions found. Try adding more details.' 
                              : 'Type at least 3 characters'}
                          </div>
                        )}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default PatientSection;
