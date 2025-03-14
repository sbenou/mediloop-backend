
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PhoneInput } from "@/components/ui/phone-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddressFields from "@/components/address/AddressFields";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from 'lucide-react';

interface TeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  phoneValue: string;
  setPhoneValue: (value: string) => void;
  nokPhoneValue: string;
  setNokPhoneValue: (value: string) => void;
  entityType?: 'doctor' | 'pharmacy';
  showAllTabs?: boolean;
}

const formSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  role: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  nok_full_name: z.string().optional(),
  nok_relationship: z.string().optional(),
  nok_address_line1: z.string().optional(),
  nok_address_line2: z.string().optional(),
  nok_city: z.string().optional(),
  nok_postal_code: z.string().optional(),
  nok_country: z.string().optional(),
});

export const TeamMemberDialog: React.FC<TeamMemberDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  phoneValue,
  setPhoneValue,
  nokPhoneValue,
  setNokPhoneValue,
  entityType = 'pharmacy',
  showAllTabs = false
}) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      role: entityType === 'doctor' ? 'assistant' : 'staff',
      address_line1: "",
      address_line2: "",
      city: "",
      postal_code: "",
      country: "Luxembourg",
      nok_full_name: "",
      nok_relationship: "",
      nok_address_line1: "",
      nok_address_line2: "",
      nok_city: "",
      nok_postal_code: "",
      nok_country: "Luxembourg",
    }
  });

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      // Combine form data with phone numbers
      const submissionData = {
        ...data,
        phone_number: phoneValue,
        nok_phone_number: nokPhoneValue,
      };

      // Call the onSubmit handler
      await onSubmit(submissionData);

      // Reset form
      form.reset();
      setPhoneValue('');
      setNokPhoneValue('');
      setActiveTab('personal');
      
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add team member. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const nextTab = () => {
    if (activeTab === 'personal') setActiveTab('address');
    else if (activeTab === 'address') setActiveTab('nextofkin');
  };

  const prevTab = () => {
    if (activeTab === 'nextofkin') setActiveTab('address');
    else if (activeTab === 'address') setActiveTab('personal');
  };

  const roleOptions = entityType === 'doctor' 
    ? [
        { value: 'assistant', label: 'Medical Assistant' },
        { value: 'nurse', label: 'Nurse' },
        { value: 'receptionist', label: 'Receptionist' }
      ]
    : [
        { value: 'pharmacist', label: 'Pharmacist' },
        { value: 'technician', label: 'Pharmacy Technician' },
        { value: 'assistant', label: 'Pharmacy Assistant' },
        { value: 'intern', label: 'Intern' }
      ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Team Member</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            {showAllTabs ? (
              <Tabs value={activeTab} onValueChange={handleTabChange}>
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
                          <Input placeholder="Enter full name" {...field} />
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
                          <Input type="email" placeholder="Enter email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="phone-input">Phone Number</Label>
                    <PhoneInput
                      value={phoneValue}
                      onChange={setPhoneValue}
                      defaultCountry="LU"
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            {roleOptions.map(option => (
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

                  <div className="flex justify-end">
                    <Button type="button" onClick={nextTab}>
                      Next
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="address" className="space-y-4">
                  <AddressFields 
                    form={form} 
                    disabled={false}
                  />
                  
                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevTab}>
                      Back
                    </Button>
                    <Button type="button" onClick={nextTab}>
                      Next
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="nextofkin" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nok_full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Next of Kin Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nok_relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., Spouse, Parent" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="nok-phone-input">Next of Kin Phone Number</Label>
                    <PhoneInput
                      value={nokPhoneValue}
                      onChange={setNokPhoneValue}
                      defaultCountry="LU"
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Next of Kin Address</h3>
                    <AddressFields 
                      form={form}
                      prefix="nok_"
                      disabled={false}
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevTab}>
                      Back
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Team Member
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              // Simple form for when all tabs are not needed
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
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
                        <Input type="email" placeholder="Enter email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label htmlFor="phone-input">Phone Number</Label>
                  <PhoneInput
                    value={phoneValue}
                    onChange={setPhoneValue}
                    defaultCountry="LU"
                  />
                </div>

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          {roleOptions.map(option => (
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
              </div>
            )}

            {!showAllTabs && (
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Team Member
                </Button>
              </DialogFooter>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
