import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, Mail, UserX } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import UserAvatar from '@/components/user-menu/UserAvatar';

interface PharmacyTeamProps {
  pharmacyId: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
}

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
  next_of_kin_address: z.string().min(2, { message: "Address is required." }),
});

const PharmacyTeam: React.FC<PharmacyTeamProps> = ({ pharmacyId }) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("personal");
  
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
      next_of_kin_relation: "",
      next_of_kin_address: "",
    },
  });

  useEffect(() => {
    fetchTeamMembers();
  }, [pharmacyId]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      
      const { data: pharmacyUsers, error: pharmacyError } = await supabase
        .from('user_pharmacies')
        .select('user_id')
        .eq('pharmacy_id', pharmacyId);
      
      if (pharmacyError) throw pharmacyError;
      
      if (!pharmacyUsers || pharmacyUsers.length === 0) {
        setTeamMembers([]);
        return;
      }
      
      const userIds = pharmacyUsers.map(pu => pu.user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role, is_blocked')
        .in('id', userIds);
        
      if (profilesError) throw profilesError;
      
      if (profiles) {
        const members: TeamMember[] = profiles.map(profile => ({
          id: profile.id,
          user_id: profile.id,
          full_name: profile.full_name || 'Unknown',
          email: profile.email || 'No email',
          avatar_url: profile.avatar_url,
          role: profile.role || 'pharmacy_user',
          is_active: !profile.is_blocked,
        }));
        
        setTeamMembers(members);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load pharmacy team members",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: !isActive })
        .eq('id', userId);

      if (error) throw error;

      setTeamMembers(prev => 
        prev.map(member => 
          member.user_id === userId 
            ? { ...member, is_active: !isActive } 
            : member
        )
      );

      toast({
        title: "Success",
        description: `User ${isActive ? 'deactivated' : 'activated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user status",
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.full_name,
            role: values.role,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      const userId = authData.user.id;

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: values.full_name,
          email: values.email,
          role: values.role,
        });

      if (profileError) throw profileError;

      const { error: pharmacyAssocError } = await supabase
        .from('user_pharmacies')
        .insert({
          user_id: userId,
          pharmacy_id: pharmacyId,
        });

      if (pharmacyAssocError) throw pharmacyAssocError;

      const { error: addressError } = await supabase
        .from('addresses')
        .insert({
          user_id: userId,
          street: values.street,
          city: values.city,
          postal_code: values.postal_code,
          country: values.country,
          type: 'home',
          is_default: true,
        });

      if (addressError) throw addressError;

      const { error: nextOfKinError } = await supabase
        .from('next_of_kin')
        .insert({
          user_id: userId,
          full_name: values.next_of_kin_name,
          phone_number: values.next_of_kin_phone,
          relation: values.next_of_kin_relation,
          street: values.next_of_kin_address,
          city: values.city,
          postal_code: values.postal_code,
          country: values.country,
        });

      if (nextOfKinError) throw nextOfKinError;

      toast({
        title: "Success",
        description: "New team member added successfully",
      });

      setAddUserOpen(false);
      form.reset();
      fetchTeamMembers();
    } catch (error) {
      console.error('Error adding new user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add new team member",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Pharmacy Team</h3>
        <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Team Member</DialogTitle>
              <DialogDescription>
                Create a new pharmacy staff member account
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setCurrentTab("address")}>
                        Next
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="address" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
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
                        name="postal_code"
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
                    
                    <div className="flex justify-between space-x-2">
                      <Button type="button" variant="outline" onClick={() => setCurrentTab("personal")}>
                        Previous
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setCurrentTab("nextofkin")}>
                        Next
                      </Button>
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
                            <Input placeholder="+1 (555) 123-4567" {...field} />
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
                            <Input placeholder="Spouse" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="next_of_kin_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="456 Oak Ave" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-between space-x-2">
                      <Button type="button" variant="outline" onClick={() => setCurrentTab("address")}>
                        Previous
                      </Button>
                      <Button type="submit">
                        Create User
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </form>
            </Form>
            
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setAddUserOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <p>Loading team members...</p>
        </div>
      ) : teamMembers.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <UserX className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No team members</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new team member.</p>
          <div className="mt-6">
            <Button onClick={() => setAddUserOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Team Member
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {teamMembers.map(member => (
            <Card key={member.user_id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gray-100 pt-6 pb-4 px-4 flex flex-col items-center">
                  <div className="relative">
                    <UserAvatar 
                      userProfile={{
                        id: member.user_id,
                        avatar_url: member.avatar_url,
                        full_name: member.full_name,
                        role: member.role,
                        role_id: null,
                        email: member.email,
                        date_of_birth: null,
                        city: null,
                        auth_method: null,
                        is_blocked: !member.is_active,
                        doctor_stamp_url: null,
                        doctor_signature_url: null,
                        cns_card_front: null,
                        cns_card_back: null,
                        cns_number: null,
                        deleted_at: null,
                        created_at: null,
                        updated_at: null,
                        license_number: null
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1">
                      <Switch 
                        checked={member.is_active} 
                        onCheckedChange={() => handleToggleActive(member.user_id, member.is_active)}
                        className={member.is_active ? "bg-green-500" : "bg-gray-400"}
                      />
                    </div>
                  </div>
                  <h3 className="font-medium text-center mt-2 truncate w-full">{member.full_name}</h3>
                  <p className="text-sm text-gray-500 truncate w-full text-center">
                    {member.role === 'pharmacist' ? 'Pharmacist' : 'Staff Member'}
                  </p>
                </div>
                <div className="p-4">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-sm truncate">{member.email}</p>
                  </div>
                  <div className="mt-4 flex justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/pharmacy/staff/${member.user_id}`}>View Profile</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PharmacyTeam;
