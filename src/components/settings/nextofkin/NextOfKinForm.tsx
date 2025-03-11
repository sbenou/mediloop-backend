
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { NextOfKin, RelationType } from "../types";
import { MapPin, Search, Loader2, X } from "lucide-react";
import { searchAddressesByQuery } from "@/services/address-service";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isAddressPopoverOpen, setIsAddressPopoverOpen] = useState(false);
  
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

  const handleAddressSearch = async (query: string) => {
    setAddressSearchQuery(query);
    
    if (query.length >= 3) {
      setIsSearching(true);
      try {
        const results = await searchAddressesByQuery(query);
        setAddressSuggestions(results);
      } catch (error) {
        console.error('Error searching addresses:', error);
      } finally {
        setIsSearching(false);
      }
    } else {
      setAddressSuggestions([]);
    }
  };

  const handleAddressSelect = (address: any) => {
    form.setValue('street', address.street);
    form.setValue('city', address.city);
    form.setValue('postal_code', address.postal_code);
    form.setValue('country', address.country);
    setIsAddressPopoverOpen(false);
  };

  const clearAddressSearch = () => {
    setAddressSearchQuery("");
    setAddressSuggestions([]);
  };

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
                <Popover open={isAddressPopoverOpen} onOpenChange={setIsAddressPopoverOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Start typing to search address..." 
                          value={addressSearchQuery || field.value}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            handleAddressSearch(e.target.value);
                          }}
                          onFocus={() => setIsAddressPopoverOpen(true)}
                        />
                      </FormControl>
                      {addressSearchQuery && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={clearAddressSearch}
                          className="absolute right-8 top-0 h-full"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setIsAddressPopoverOpen(!isAddressPopoverOpen)}
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[300px] md:w-[400px]" align="start">
                    <Command>
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Input
                          placeholder="Search address..."
                          value={addressSearchQuery}
                          onChange={(e) => handleAddressSearch(e.target.value)}
                          className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none"
                        />
                      </div>
                      {isSearching && (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <p className="text-sm text-muted-foreground">Searching addresses...</p>
                        </div>
                      )}
                      <CommandList>
                        <CommandGroup>
                          {addressSuggestions.length > 0 ? (
                            addressSuggestions.map((address, index) => (
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
                            <div className="p-4 text-sm text-center text-muted-foreground">
                              {addressSearchQuery.length >= 3 
                                ? 'No suggestions found. Try a different search.' 
                                : 'Type at least 3 characters to search'}
                            </div>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
