
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PharmacyTeamMember } from '@/types/supabase';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

// Define the form schema with Zod
const formSchema = z.object({
  full_name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone_number: z.string().optional(),
  role: z.string(),
});

// Form values type that matches our schema
export type PharmacyTeamMemberFormValues = z.infer<typeof formSchema>;

interface PharmacyTeamMemberFormProps {
  pharmacyId: string;
  teamMember?: PharmacyTeamMember & {
    full_name?: string;
    email?: string;
    phone_number?: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const PharmacyTeamMemberForm: React.FC<PharmacyTeamMemberFormProps> = ({
  pharmacyId,
  teamMember,
  onSuccess,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize the form with default values or the values of the team member being edited
  const form = useForm<PharmacyTeamMemberFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: teamMember?.full_name || '',
      email: teamMember?.email || '',
      phone_number: teamMember?.phone_number || '',
      role: teamMember?.role || 'pharmacy_user',
    }
  });

  const handleSubmit = async (values: PharmacyTeamMemberFormValues) => {
    try {
      setIsSubmitting(true);
      
      if (teamMember) {
        // Update existing team member
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: values.full_name,
            email: values.email,
            phone_number: values.phone_number,
          })
          .eq('id', teamMember.user_id);
          
        if (error) throw error;
        
        // Update role in pharmacy_team_members if changed
        if (teamMember.role !== values.role) {
          const { error: roleError } = await supabase
            .from('pharmacy_team_members')
            .update({ role: values.role })
            .eq('id', teamMember.id);
            
          if (roleError) throw roleError;
        }
        
        toast({
          title: "Success",
          description: "Team member updated successfully",
        });
      } else {
        // Create new team member - first create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: values.email,
          password: 'TemporaryPassword123', // This should be randomly generated or provided by form
          options: {
            data: {
              full_name: values.full_name,
              role: values.role,
            }
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Failed to create user account");

        // Add to pharmacy team
        const { error: teamError } = await supabase
          .from('pharmacy_team_members')
          .insert({
            user_id: authData.user.id,
            pharmacy_id: pharmacyId,
            role: values.role,
          });

        if (teamError) throw teamError;

        toast({
          title: "Success",
          description: "New team member added successfully",
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving team member:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${teamMember ? 'update' : 'add'} team member`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                <Input 
                  type="email" 
                  placeholder="john@example.com" 
                  {...field} 
                  disabled={!!teamMember} // Disable email editing for existing members
                />
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
              <FormLabel>Phone Number (optional)</FormLabel>
              <FormControl>
                <Input placeholder="+1234567890" {...field} />
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
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : teamMember ? 'Update' : 'Add'} Team Member
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PharmacyTeamMemberForm;
