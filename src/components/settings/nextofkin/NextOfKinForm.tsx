
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { NextOfKin, RelationType } from "../types";
import { MapPin, Loader2 } from "lucide-react";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { searchAddress } from "@/services/geocoding";

const relationOptions: { value: RelationType; label: string }[] = [
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "spouse", label: "Spouse" },
  { value: "sibling", label: "Sibling" },
  { value: "friend", label: "Friend" },
  { value: "other", label: "Other" },
];

// Schema for form validation
const formSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters."),
  phone_number: z.string().min(5, "Phone number is required."),
  relation: z.enum(["parent", "child", "spouse", "sibling", "friend", "other"]),
  street: z.string().min(3, "Street address is required."),
  city: z.string().min(2, "City is required."),
  postal_code: z.string().min(3, "Postal code is required."),
  country: z.string().min(2, "Country is required."),
});

type FormData = z.infer<typeof formSchema>;

interface NextOfKinFormProps {
  initialData?: NextOfKin;
  onSubmit: (data: FormData & { id?: string }) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export const NextOfKinForm = ({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isEditing = false 
}: NextOfKinFormProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streetInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      full_name: initialData.full_name,
      phone_number: initialData.phone_number,
      relation: initialData.relation,
      street: initialData.street,
      city: initialData.city,
      postal_code: initialData.postal_code,
      country: initialData.country,
    } : {
      full_name: "",
      phone_number: "",
      relation: "other" as RelationType,
      street: "",
      city: "",
      postal_code: "",
      country: "",
    }
  });

  const handleSubmit = (data: FormData) => {
    if (isEditing && initialData) {
      onSubmit({ ...data, id: initialData.id });
    } else {
      onSubmit(data);
    }
  };

  // Handle street address input changes with debounce
  const handleStreetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    form.setValue('street', query);
    
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
      const results = await searchAddress(query);
      console.log('Address suggestions received:', results);
      setSuggestions(results);
    } catch (error) {
      console.error("Error searching addresses:", error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle address suggestion selection
  const handleAddressSelect = (address: any) => {
    console.log('Selected address:', address);
    
    form.setValue('street', address.street || '');
    form.setValue('city', address.city || '');
    form.setValue('postal_code', address.postal_code || '');
    form.setValue('country', address.country || '');
    
    setShowSuggestions(false);
  };

  // Handle clicking outside to close suggestions
  const handleDocumentClick = (e: MouseEvent) => {
    if (showSuggestions && streetInputRef.current && !streetInputRef.current.contains(e.target as Node)) {
      setShowSuggestions(false);
    }
  };

  // Add and remove document click listener
  useEffect(() => {
    if (showSuggestions) {
      document.addEventListener('click', handleDocumentClick);
    }
    
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [showSuggestions]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="John Doe" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="+1234567890" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="relation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relation</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relation" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {relationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Address</h3>
          
          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input 
                      {...field}
                      ref={streetInputRef}
                      onChange={handleStreetChange}
                      placeholder="Street address" 
                      className="pr-10"
                    />
                  </FormControl>
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
                                  {field.value.length >= 3 
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
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="New York" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postal_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="10001" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="United States" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? "Update" : "Add"} Contact
          </Button>
        </div>
      </form>
    </Form>
  );
};
