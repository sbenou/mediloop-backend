
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";
import AddressFields from "@/components/address/AddressFields";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, MapPin, Phone, Users } from "lucide-react";

const teamMemberSchema = z.object({
  full_name: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Please enter a valid email address."),
  role: z.string(),
  phone_number: z.string().optional(),
  street: z.string().min(3, "Street address is required"),
  city: z.string().min(2, "City is required"),
  postal_code: z.string().min(2, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
  next_of_kin_name: z.string().min(3, "Next of kin name is required").optional(),
  next_of_kin_phone: z.string().optional(),
  next_of_kin_relation: z.string().min(2, "Relation is required").optional(),
  next_of_kin_street: z.string().optional(),
  next_of_kin_city: z.string().optional(),
  next_of_kin_postal_code: z.string().optional(),
  next_of_kin_country: z.string().optional(),
});

type TeamMemberFormValues = z.infer<typeof teamMemberSchema>;

interface TeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  phoneValue: string;
  setPhoneValue: (value: string) => void;
  nokPhoneValue: string;
  setNokPhoneValue: (value: string) => void;
  entityType?: 'doctor' | 'pharmacy';
}

export const TeamMemberDialog: React.FC<TeamMemberDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  phoneValue,
  setPhoneValue,
  nokPhoneValue,
  setNokPhoneValue,
  entityType = 'pharmacy'
}) => {
  const [activeTab, setActiveTab] = useState("personal");
  
  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      full_name: "",
      email: "",
      role: entityType === 'doctor' ? "technician" : "pharmacist",
      phone_number: "",
      street: "",
      city: "",
      postal_code: "",
      country: "",
      next_of_kin_name: "",
      next_of_kin_phone: "",
      next_of_kin_relation: "",
      next_of_kin_street: "",
      next_of_kin_city: "",
      next_of_kin_postal_code: "",
      next_of_kin_country: "",
    },
  });

  const handleSubmit = (data: TeamMemberFormValues) => {
    const formData = {
      ...data,
      phone_number: phoneValue,
      next_of_kin_phone: nokPhoneValue,
    };
    onSubmit(formData);
    form.reset();
    setActiveTab("personal");
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const goToNextTab = () => {
    if (activeTab === "personal") {
      setActiveTab("address");
    } else if (activeTab === "address") {
      setActiveTab("nextofkin");
    }
  };

  const goToPreviousTab = () => {
    if (activeTab === "nextofkin") {
      setActiveTab("address");
    } else if (activeTab === "address") {
      setActiveTab("personal");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Team Member</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="personal" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Personal</span>
                </TabsTrigger>
                <TabsTrigger value="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Address</span>
                </TabsTrigger>
                <TabsTrigger value="nextofkin" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Next of Kin</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <Input placeholder="johndoe@example.com" {...field} />
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
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {entityType === 'doctor' ? (
                            <>
                              <SelectItem value="technician">Medical Assistant</SelectItem>
                              <SelectItem value="nurse">Nurse</SelectItem>
                              <SelectItem value="intern">Medical Intern</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="pharmacist">Pharmacist</SelectItem>
                              <SelectItem value="technician">Pharmacy Technician</SelectItem>
                              <SelectItem value="intern">Pharmacy Intern</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <PhoneInput
                    value={phoneValue}
                    onChange={setPhoneValue}
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button type="button" onClick={goToNextTab}>Next</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="address" className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Address Information</h4>
                  <AddressFields form={form} />
                </div>
                
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousTab}>
                    Previous
                  </Button>
                  <Button type="button" onClick={goToNextTab}>Next</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="nextofkin" className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Next of Kin Information</h4>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        name="next_of_kin_relation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Spouse, Parent, Child" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <PhoneInput
                        value={nokPhoneValue}
                        onChange={setNokPhoneValue}
                        placeholder="Enter emergency contact number"
                      />
                    </div>
                    
                    <div className="mt-4">
                      <h5 className="font-medium mb-2">Next of Kin Address</h5>
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="next_of_kin_street"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Street</FormLabel>
                              <FormControl>
                                <Input placeholder="Street address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="next_of_kin_city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="City" {...field} />
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
                                  <Input placeholder="Postal Code" {...field} />
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
                                <Input placeholder="Country" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={goToPreviousTab}>
                    Previous
                  </Button>
                  <Button type="submit">Add Team Member</Button>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className={activeTab !== "nextofkin" ? "hidden" : ""}>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
