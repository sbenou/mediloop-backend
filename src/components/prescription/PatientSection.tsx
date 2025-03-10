
import { useState, useEffect } from "react";
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
import { Command, CommandList, CommandItem, CommandGroup } from "@/components/ui/command";
import { searchAddressesByQuery } from "@/services/address-service";

interface PatientSectionProps {
  form: UseFormReturn<any>;
}

const PatientSection = ({ form }: PatientSectionProps) => {
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (addressQuery && addressQuery.length > 3) {
        searchAddresses(addressQuery);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [addressQuery]);

  const searchAddresses = async (query: string) => {
    setIsLoadingAddresses(true);
    try {
      const suggestions = await searchAddressesByQuery(query);
      setAddressSuggestions(suggestions);
      setIsPopoverOpen(suggestions.length > 0);
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
        name="patientAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Patient Address</FormLabel>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <div>
                  <Input 
                    value={addressQuery}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      setAddressQuery(e.target.value);
                    }}
                    className="bg-accent/5" 
                    placeholder="Start typing an address..."
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <Command>
                  <CommandList>
                    {isLoadingAddresses ? (
                      <div className="flex items-center justify-center p-2">
                        <div className="animate-spin h-4 w-4 rounded-full border-2 border-gray-900 border-opacity-25 border-t-gray-600"></div>
                        <span className="ml-2 text-sm">Searching...</span>
                      </div>
                    ) : (
                      <CommandGroup heading="Address suggestions">
                        {addressSuggestions.map((address, index) => (
                          <CommandItem
                            key={index}
                            onSelect={() => selectAddress(address)}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span>{address.formatted}</span>
                            </div>
                          </CommandItem>
                        ))}
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
