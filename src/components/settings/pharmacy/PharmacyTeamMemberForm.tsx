
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin } from "lucide-react";
import AddressSearchDialog from "@/components/address/AddressSearchDialog";

// Define types for team member roles
export type TeamMemberRole = 'pharmacist' | 'technician' | 'intern' | 'other';

export interface PharmacyTeamMember {
  id?: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: TeamMemberRole;
  pharmacy_id: string;
  status: 'active' | 'inactive';
  bio?: string;
  profile_image?: string;
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  created_at?: string;
  updated_at?: string;
}

const roleOptions: { value: TeamMemberRole; label: string }[] = [
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'technician', label: 'Pharmacy Technician' },
  { value: 'intern', label: 'Pharmacy Intern' },
  { value: 'other', label: 'Other Staff' },
];

const formSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone_number: z.string().min(5, "Phone number is required."),
  role: z.enum(['pharmacist', 'technician', 'intern', 'other']),
  bio: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface PharmacyTeamMemberFormProps {
  initialData?: PharmacyTeamMember;
  onSubmit: (data: FormData & { id?: string }) => void;
  onCancel: () => void;
  isEditing?: boolean;
  pharmacyId: string;
}

export const PharmacyTeamMemberForm = ({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
  pharmacyId
}: PharmacyTeamMemberFormProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const [isAddressSearchOpen, setIsAddressSearchOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      full_name: initialData.full_name,
      email: initialData.email,
      phone_number: initialData.phone_number,
      role: initialData.role,
      bio: initialData.bio || "",
      street: initialData.street || "",
      city: initialData.city || "",
      postal_code: initialData.postal_code || "",
      country: initialData.country || "",
    } : {
      full_name: "",
      email: "",
      phone_number: "",
      role: "pharmacist" as TeamMemberRole,
      bio: "",
      street: "",
      city: "",
      postal_code: "",
      country: "",
    }
  });

  const handleSubmit = (data: FormData) => {
    const submitData = {
      ...data,
      pharmacy_id: pharmacyId,
      status: 'active' as const,
    };

    if (isEditing && initialData?.id) {
      onSubmit({ ...submitData, id: initialData.id });
    } else {
      onSubmit(submitData);
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 pt-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="john.doe@example.com" />
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
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map((option) => (
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

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biography</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Brief professional biography..." 
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            
            <TabsContent value="address" className="space-y-4 pt-4">
              <div className="space-y-2">
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
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update" : "Add"} Team Member
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
