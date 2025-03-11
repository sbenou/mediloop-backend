import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
// Fix incorrect import - remove PharmacyTeamMemberForm
import { searchAddressesByQuery, softDeleteTeamMember } from '@/services/address-service';
import { PharmacyTeamMemberWithProfile } from '@/types/supabase';
import UserAvatar from '@/components/user-menu/UserAvatar';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface PharmacyTeamProps {
  pharmacyId: string;
}

interface AddressSuggestion {
  street: string;
  city: string;
  postal_code: string;
  country: string;
  formatted: string;
}

const formSchema = z.object({
  full_name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  role: z.string(),
  street: z.string().min(2, { message: "Street is required." }),
  city: z.string().min(2, { message: "City is required." }),
  postal_code: z.string().min(2, { message: "Postal code is required." }),
  country: z.string().min(2, { message: "Country is required." }),
});

const PharmacyTeam: React.FC<PharmacyTeamProps> = ({ pharmacyId }) => {
  const [teamMembers, setTeamMembers] = useState<PharmacyTeamMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("personal");
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpenAddressSuggestions, setIsOpenAddressSuggestions] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      role: "pharmacy_user",
      street: "",
      city: "",
      postal_code: "",
      country: "",
    },
  });

  useEffect(() => {
    fetchTeamMembers();
  }, [pharmacyId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (addressQuery.trim() && addressQuery.length > 3) {
        searchAddresses(addressQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [addressQuery]);

  const searchAddresses = async (query: string) => {
    try {
      setIsAddressLoading(true);
      const suggestions = await searchAddressesByQuery(query);
      setAddressSuggestions(suggestions);
      setIsOpenAddressSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Error searching addresses:', error);
      toast({
        title: "Error",
        description: "Failed to search for addresses",
        variant: "destructive"
      });
    } finally {
      setIsAddressLoading(false);
    }
  };

  const selectAddress = (address: AddressSuggestion) => {
    form.setValue('street', address.street || '');
    form.setValue('city', address.city || '');
    form.setValue('postal_code', address.postal_code || '');
    form.setValue('country', address.country || '');
    setIsOpenAddressSuggestions(false);
    setAddressQuery(address.street || '');
    
    toast({
      title: "Address Selected",
      description: "Address details have been filled automatically"
    });
  };

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      
      const { data: pharmacyTeam, error: teamError } = await supabase
        .from('pharmacy_team_members')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .is('deleted_at', null);
      
      if (teamError) throw teamError;
      
      if (!pharmacyTeam || pharmacyTeam.length === 0) {
        setTeamMembers([]);
        return;
      }
      
      const userIds = pharmacyTeam.map(member => member.user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role, is_blocked')
        .in('id', userIds);
        
      if (profilesError) throw profilesError;
      
      if (profiles) {
        const membersWithProfiles: PharmacyTeamMemberWithProfile[] = pharmacyTeam.map(teamMember => {
          const profile = profiles.find(p => p.id === teamMember.user_id);
          return {
            ...teamMember,
            full_name: profile?.full_name || 'Unknown',
            email: profile?.email || 'No email',
            avatar_url: profile?.avatar_url,
            is_active: profile ? !profile.is_blocked : true
          };
        });
        
        setTeamMembers(membersWithProfiles);
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

  const handleDeleteMember = async (memberId: string) => {
    try {
      const success = await softDeleteTeamMember(memberId);
      
      if (!success) {
        throw new Error('Failed to soft delete team member');
      }
      
      toast({
        title: "Success",
        description: "Team member removed successfully",
      });
      
      fetchTeamMembers();
    } catch (error) {
      console.error('Error removing team member:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove team member",
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Here you would handle the form submission, e.g., sending data to Supabase
      console.log("Form values:", values);
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
        <Button onClick={() => setAddUserOpen(true)}>Add Team Member</Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <p>Loading team members...</p>
        </div>
      ) : teamMembers.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No team members</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new team member.</p>
          <div className="mt-6">
            <Button onClick={() => setAddUserOpen(true)}>Add Team Member</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {teamMembers.map(member => (
            <Card key={member.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gray-100 pt-6 pb-4 px-4 flex flex-col items-center">
                  <div className="relative">
                    <UserAvatar userProfile={member} />
                  </div>
                  <h3 className="font-medium text-center mt-2 truncate w-full">{member.full_name}</h3>
                  <p className="text-sm text-gray-500 truncate w-full text-center">{member.role}</p>
                </div>
                <div className="p-4">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-7 2.829v4.142m2.171-4.142l-2.171 2.172m0 0l-2.171-2.171m2.171 2.172L9.828 15" />
                    </svg>
                    <p className="text-sm truncate">{member.email}</p>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <Button size="sm" onClick={() => handleToggleActive(member.user_id, Boolean(member.is_active))}>
                        Toggle
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteMember(member.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
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
                    <Button type="button" variant="outline" onClick={() => setAddUserOpen(false)}>
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
                          <Input
                            placeholder="Start typing your address..."
                            value={addressQuery}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              setAddressQuery(e.target.value);
                              if (e.target.value.length > 3) {
                                searchAddresses(e.target.value);
                              }
                            }}
                          />
                        </div>
                        {isAddressLoading && <div className="text-xs text-muted-foreground mt-1">Searching for addresses...</div>}
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
                    <Button type="button" variant="outline" onClick={() => setAddUserOpen(false)}>
                      Cancel
                    </Button>
                    <div className="flex space-x-2">
                      <Button type="button" variant="outline" onClick={() => setCurrentTab("personal")}>
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
    </div>
  );
};

export default PharmacyTeam;
