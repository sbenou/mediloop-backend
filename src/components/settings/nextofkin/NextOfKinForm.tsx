
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { NextOfKin, RelationType } from "../types";
import AddressSearchDialog from "@/components/address/AddressSearchDialog";
import { MapPin } from "lucide-react";

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
  const [isAddressSearchOpen, setIsAddressSearchOpen] = useState(false);
  
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

  const handleAddressSelect = (addressString: string) => {
    try {
      // Find the formatted address in the string
      const addressParts = addressString.split(',').map(part => part.trim());
      
      if (addressParts.length >= 1) {
        // Extract components from the address string
        const street = addressParts[0] || '';
        const city = addressParts.length > 1 ? addressParts[1] : '';
        
        // Look for postal code in the address (usually in the format "12345")
        const postalCodeMatch = addressString.match(/\b\d{4,5}\b/);
        const postalCode = postalCodeMatch ? postalCodeMatch[0] : '';
        
        // Usually the country is the last part
        const country = addressParts.length > 2 ? addressParts[addressParts.length - 1] : '';
        
        // Update the form values
        form.setValue('street', street);
        if (city) form.setValue('city', city);
        if (postalCode) form.setValue('postal_code', postalCode);
        if (country) form.setValue('country', country);
      }
    } catch (error) {
      console.error('Error parsing address:', error);
    }
  };

  return (
    <>
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
                      <Input {...field} placeholder="123 Main St" />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setIsAddressSearchOpen(true)}
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
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

      {/* Address Search Dialog */}
      <AddressSearchDialog 
        open={isAddressSearchOpen}
        onOpenChange={setIsAddressSearchOpen}
        onSelectAddress={handleAddressSelect}
        initialValue={form.getValues('street')}
      />
    </>
  );
};
