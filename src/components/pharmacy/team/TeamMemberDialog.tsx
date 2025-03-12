
import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Loader2 } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { CommandInput, CommandList, CommandItem, CommandGroup, Command } from "@/components/ui/command";
import { searchAddress } from '@/services/geocoding';
import { toast } from '@/components/ui/use-toast';

// Define the relationship options
const relationOptions = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'husband', label: 'Husband' },
  { value: 'wife', label: 'Wife' },
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'sister', label: 'Sister' },
  { value: 'brother', label: 'Brother' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'friend', label: 'Friend' },
  { value: 'colleague', label: 'Work Colleague' },
  { value: 'neighbor', label: 'Neighbor' },
  { value: 'partner', label: 'Partner' },
  { value: 'son', label: 'Son' },
  { value: 'daughter', label: 'Daughter' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'other', label: 'Other' },
];

interface AddressSuggestion {
  street: string;
  city: string;
  postal_code: string;
  country: string;
  formatted: string;
}

// Form schema 
const formSchema = z.object({
  full_name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  role: z.string(),
  street: z.string().min(2, { message: "Street is required." }),
  city: z.string().min(2, { message: "City is required." }),
  postal_code: z.string().min(2, { message: "Postal code is required." }),
  country: z.string().min(2, { message: "Country is required." }),
  next_of_kin_name: z.string().min(2, { message: "Next of kin name is required." }),
  next_of_kin_phone: z.string().min(5, { message: "Valid phone number is required." }),
  next_of_kin_relation: z.string().min(2, { message: "Relation is required." }),
  next_of_kin_street: z.string().min(2, { message: "Street is required." }),
  next_of_kin_city: z.string().min(2, { message: "City is required." }),
  next_of_kin_postal_code: z.string().min(2, { message: "Postal code is required." }),
  next_of_kin_country: z.string().min(2, { message: "Country is required." }),
});

interface TeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>;
  phoneValue: string;
  setPhoneValue: (value: string) => void;
  nokPhoneValue: string;
  setNokPhoneValue: (value: string) => void;
}

export const TeamMemberDialog: React.FC<TeamMemberDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  phoneValue,
  setPhoneValue,
  nokPhoneValue,
  setNokPhoneValue
}) => {
  const [currentTab, setCurrentTab] = useState("personal");
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpenAddressSuggestions, setIsOpenAddressSuggestions] = useState(false);
  const [nokAddressQuery, setNokAddressQuery] = useState('');
  const [nokAddressSuggestions, setNokAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpenNokAddressSuggestions, setIsOpenNokAddressSuggestions] = useState(false);
  const [isNokAddressLoading, setIsNokAddressLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nokSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streetInputRef = useRef<HTMLInputElement>(null);
  const nokStreetInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      role: "pharmacy_user",
      street: "",
      city: "",
      postal_code: "",
      country: "",
      next_of_kin_name: "",
      next_of_kin_phone: "",
      next_of_kin_relation: "other",
      next_of_kin_street: "",
      next_of_kin_city: "",
      next_of_kin_postal_code: "",
      next_of_kin_country: "",
    },
  });

  React.useEffect(() => {
    // Handle clicking outside to close suggestions
    const handleDocumentClick = (e: MouseEvent) => {
      if (isOpenAddressSuggestions && streetInputRef.current && !streetInputRef.current.contains(e.target as Node)) {
        setIsOpenAddressSuggestions(false);
      }
      if (isOpenNokAddressSuggestions && nokStreetInputRef.current && !nokStreetInputRef.current.contains(e.target as Node)) {
        setIsOpenNokAddressSuggestions(false);
      }
    };

    if (isOpenAddressSuggestions || isOpenNokAddressSuggestions) {
      document.addEventListener('click', handleDocumentClick);
    }
    
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [isOpenAddressSuggestions, isOpenNokAddressSuggestions]);

  // Handle street address input changes with debounce
  const handleStreetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setAddressQuery(query);
    form.setValue('street', query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (query && query.length >= 3) {
      setIsAddressLoading(true);
      setIsOpenAddressSuggestions(true);
      
      searchTimeoutRef.current = setTimeout(() => {
        searchAddresses(query, setAddressSuggestions, setIsAddressLoading);
      }, 300); // 300ms debounce time
    } else {
      setAddressSuggestions([]);
      setIsAddressLoading(false);
      if (query.length === 0) {
        setIsOpenAddressSuggestions(false);
      }
    }
  };

  // Handle NOK street address input changes with debounce
  const handleNokStreetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setNokAddressQuery(query);
    form.setValue('next_of_kin_street', query);
    
    if (nokSearchTimeoutRef.current) {
      clearTimeout(nokSearchTimeoutRef.current);
    }
    
    if (query && query.length >= 3) {
      setIsNokAddressLoading(true);
      setIsOpenNokAddressSuggestions(true);
      
      nokSearchTimeoutRef.current = setTimeout(() => {
        searchAddresses(query, setNokAddressSuggestions, setIsNokAddressLoading);
      }, 300); // 300ms debounce time
    } else {
      setNokAddressSuggestions([]);
      setIsNokAddressLoading(false);
      if (query.length === 0) {
        setIsOpenNokAddressSuggestions(false);
      }
    }
  };

  // Search for addresses (shared function)
  const searchAddresses = async (
    query: string, 
    setSuggestions: React.Dispatch<React.SetStateAction<AddressSuggestion[]>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    try {
      console.log('Executing address search for:', query);
      const results = await searchAddress(query);
      console.log('Address suggestions received:', results);
      setSuggestions(results);
    } catch (error) {
      console.error("Error searching addresses:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle address suggestion selection
  const handleAddressSelect = (address: any) => {
    console.log('Selected address:', address);
    
    form.setValue('street', address.street || '');
    form.setValue('city', address.city || '');
    form.setValue('postal_code', address.postal_code || '');
    form.setValue('country', address.country || '');
    
    setAddressQuery(address.street || '');
    setIsOpenAddressSuggestions(false);
  };

  // Handle NOK address suggestion selection
  const handleNokAddressSelect = (address: any) => {
    console.log('Selected NOK address:', address);
    
    form.setValue('next_of_kin_street', address.street || '');
    form.setValue('next_of_kin_city', address.city || '');
    form.setValue('next_of_kin_postal_code', address.postal_code || '');
    form.setValue('next_of_kin_country', address.country || '');
    
    setNokAddressQuery(address.street || '');
    setIsOpenNokAddressSuggestions(false);
  };

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    values.next_of_kin_phone = nokPhoneValue;
    await onSubmit(values);
    form.reset();
    setAddressQuery('');
    setNokAddressQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Team Member</DialogTitle>
          <DialogDescription>
            Create a new pharmacy staff member account
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <Tabs defaultValue="personal" value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="personal">Personal Details</TabsTrigger>
                <TabsTrigger value="address">Address</TabsTrigger>
                <TabsTrigger value="nextofkin">Next of Kin</TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal" className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <select 
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          {...field}
                        >
                          <option value="pharmacy_user">Pharmacy Staff</option>
                          <option value="pharmacist">Pharmacist</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={() => setCurrentTab("address")}>
                    Next
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="address" className="space-y-4">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Street Address</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            {...field}
                            ref={streetInputRef}
                            placeholder="Start typing your address..." 
                            value={addressQuery}
                            onChange={handleStreetChange}
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
                        
                        {isOpenAddressSuggestions && (
                          <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                            {isAddressLoading ? (
                              <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Searching addresses...</span>
                              </div>
                            ) : (
                              <Command className="w-full">
                                <CommandList>
                                  <CommandGroup>
                                    {addressSuggestions.length > 0 ? (
                                      addressSuggestions.map((suggestion, index) => (
                                        <CommandItem
                                          key={index}
                                          onSelect={() => handleAddressSelect(suggestion)}
                                          className="cursor-pointer"
                                        >
                                          <div className="flex flex-col">
                                            <span className="font-medium">{suggestion.street}</span>
                                            <span className="text-xs text-gray-500">
                                              {[suggestion.city, suggestion.postal_code, suggestion.country]
                                                .filter(Boolean)
                                                .join(', ')}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))
                                    ) : (
                                      <div className="p-4 text-sm text-gray-500 text-center">
                                        {addressQuery.length >= 3 
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
                
                <div className="flex space-x-2">
                  <FormField
                    control={form.control}
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="10001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="United States" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-between space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <div className="flex space-x-2">
                    <Button type="button" variant="outline" onClick={() => setCurrentTab("personal")}>
                      Previous
                    </Button>
                    <Button type="button" onClick={() => setCurrentTab("nextofkin")}>
                      Next
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="nextofkin" className="space-y-4">
                <FormField
                  control={form.control}
                  name="next_of_kin_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="next_of_kin_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="rounded-md border border-input">
                          <PhoneInput
                            international
                            countryCallingCodeEditable={false}
                            defaultCountry="LU"
                            value={nokPhoneValue}
                            onChange={setNokPhoneValue}
                            onBlur={() => {
                              if (nokPhoneValue) {
                                field.onChange(nokPhoneValue);
                              }
                            }}
                            className="flex h-9 w-full rounded-md bg-transparent px-3 py-1 text-sm shadow-none"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="next_of_kin_relation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relation</FormLabel>
                      <FormControl>
                        <select 
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          {...field}
                        >
                          {relationOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="next_of_kin_street"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Street Address</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                            {...field}
                            ref={nokStreetInputRef}
                            placeholder="Start typing your address..." 
                            value={nokAddressQuery}
                            onChange={handleNokStreetChange}
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
                        
                        {isOpenNokAddressSuggestions && (
                          <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                            {isNokAddressLoading ? (
                              <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Searching addresses...</span>
                              </div>
                            ) : (
                              <Command className="w-full">
                                <CommandList>
                                  <CommandGroup>
                                    {nokAddressSuggestions.length > 0 ? (
                                      nokAddressSuggestions.map((suggestion, index) => (
                                        <CommandItem
                                          key={index}
                                          onSelect={() => handleNokAddressSelect(suggestion)}
                                          className="cursor-pointer"
                                        >
                                          <div className="flex flex-col">
                                            <span className="font-medium">{suggestion.street}</span>
                                            <span className="text-xs text-gray-500">
                                              {[suggestion.city, suggestion.postal_code, suggestion.country]
                                                .filter(Boolean)
                                                .join(', ')}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))
                                    ) : (
                                      <div className="p-4 text-sm text-gray-500 text-center">
                                        {nokAddressQuery.length >= 3 
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="next_of_kin_city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="next_of_kin_postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="10001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="next_of_kin_country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <div className="flex space-x-2">
                    <Button type="button" variant="outline" onClick={() => setCurrentTab("address")}>
                      Previous
                    </Button>
                    <Button type="submit">
                      Create User
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
