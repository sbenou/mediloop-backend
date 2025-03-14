
import React from 'react';
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

const teamMemberSchema = z.object({
  full_name: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Please enter a valid email address."),
  role: z.string(),
  phone_number: z.string().optional(),
  nok_phone_number: z.string().optional(),
  street: z.string().min(3, "Street address is required"),
  city: z.string().min(2, "City is required"),
  postal_code: z.string().min(2, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
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
  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      full_name: "",
      email: "",
      role: entityType === 'doctor' ? "technician" : "pharmacist",
      phone_number: "",
      nok_phone_number: "",
      street: "",
      city: "",
      postal_code: "",
      country: "",
    },
  });

  const handleSubmit = (data: TeamMemberFormValues) => {
    const formData = {
      ...data,
      phone_number: phoneValue,
      nok_phone_number: nokPhoneValue,
    };
    onSubmit(formData);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Team Member</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div className="space-y-2">
              <Label>Emergency Contact Number</Label>
              <PhoneInput
                value={nokPhoneValue}
                onChange={setNokPhoneValue}
                placeholder="Enter emergency contact number"
              />
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-4">Address Information</h4>
              <AddressFields form={form} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Team Member</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
