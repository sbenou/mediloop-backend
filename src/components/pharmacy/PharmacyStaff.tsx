import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserCog, Search, Eye, Pencil, UserX } from 'lucide-react';
import UserAvatar from '@/components/user-menu/UserAvatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { softDeleteTeamMember } from '@/services/address-service';

interface PharmacyStaffProps {
  pharmacyId: string;
}

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  joined_at: string;
}

const PharmacyStaff: React.FC<PharmacyStaffProps> = ({ pharmacyId }) => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<StaffMember | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const navigate = useNavigate();

  useEffect(() => {
    fetchStaffMembers();
  }, [pharmacyId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStaff(staffMembers);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredStaff(
        staffMembers.filter(
          member => 
            member.full_name.toLowerCase().includes(query) || 
            member.email.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, staffMembers]);

  const fetchStaffMembers = async () => {
    try {
      setLoading(true);
      
      const { data: teamMembers, error: teamError } = await supabase
        .from('pharmacy_team_members')
        .select('user_id, created_at')
        .eq('pharmacy_id', pharmacyId);
      
      if (teamError) throw teamError;
      
      if (!teamMembers || teamMembers.length === 0) {
        setStaffMembers([]);
        setFilteredStaff([]);
        return;
      }
      
      const userIdsWithDates = teamMembers.reduce<{[key: string]: string}>((acc, member) => {
        acc[member.user_id] = member.created_at;
        return acc;
      }, {});
      
      const userIds = teamMembers.map(member => member.user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role, is_blocked')
        .in('id', userIds);
        
      if (profilesError) throw profilesError;
      
      if (profiles) {
        const members: StaffMember[] = profiles.map(profile => ({
          id: profile.id,
          full_name: profile.full_name || 'Unknown',
          email: profile.email || 'No email',
          avatar_url: profile.avatar_url,
          role: profile.role || 'pharmacy_user',
          is_active: !profile.is_blocked,
          joined_at: userIdsWithDates[profile.id] || 'Unknown',
        }));
        
        setStaffMembers(members);
        setFilteredStaff(members);
      }
    } catch (error) {
      console.error('Error fetching staff members:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load pharmacy staff members",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user: StaffMember) => {
    setSelectedUser(user);
    setUserDetailsOpen(true);
  };

  const handleEditUser = (userId: string) => {
    navigate(`/pharmacy/staff/${userId}/edit`);
  };

  const handleTerminateUser = async (userId: string) => {
    try {
      const { error: blockError } = await supabase
        .from('profiles')
        .update({ is_blocked: true })
        .eq('id', userId);

      if (blockError) throw blockError;

      const success = await softDeleteTeamMember(userId);

      if (!success) {
        throw new Error('Failed to soft delete team member');
      }

      toast({
        title: "Success",
        description: "Staff member removed successfully",
      });

      setStaffMembers(prev => prev.filter(member => member.id !== userId));
      setFilteredStaff(prev => prev.filter(member => member.id !== userId));
    } catch (error) {
      console.error('Error terminating user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove staff member",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h3 className="text-xl font-semibold flex items-center">
          <UserCog className="mr-2 h-5 w-5" />
          Staff Management
        </h3>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <p>Loading staff members...</p>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <UserX className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchQuery.trim() !== '' ? 'No matching staff members' : 'No staff members found'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery.trim() !== '' ? 
              'Try a different search term or clear the search.' : 
              'Add team members to manage your pharmacy staff.'}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map(staff => (
                <TableRow key={staff.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <UserAvatar 
                        userProfile={{
                          id: staff.id,
                          avatar_url: staff.avatar_url,
                          full_name: staff.full_name,
                          role: staff.role,
                          role_id: null,
                          email: staff.email,
                          date_of_birth: null,
                          city: null,
                          auth_method: null,
                          is_blocked: !staff.is_active,
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
                      <div>
                        <p className="font-medium">{staff.full_name}</p>
                        <p className="text-xs text-muted-foreground">{staff.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {staff.role === 'pharmacist' ? 'Pharmacist' : 'Staff Member'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={staff.is_active ? "success" : "destructive"}>
                      {staff.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(staff.joined_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewUser(staff)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditUser(staff.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleTerminateUser(staff.id)}>
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {selectedUser && (
        <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Staff Member Details</DialogTitle>
              <DialogDescription>
                View information about {selectedUser.full_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center py-4">
              <UserAvatar 
                userProfile={{
                  id: selectedUser.id,
                  avatar_url: selectedUser.avatar_url,
                  full_name: selectedUser.full_name,
                  role: selectedUser.role,
                  role_id: null,
                  email: selectedUser.email,
                  date_of_birth: null,
                  city: null,
                  auth_method: null,
                  is_blocked: !selectedUser.is_active,
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
              <h3 className="mt-2 text-lg font-semibold">{selectedUser.full_name}</h3>
              <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              <div className="mt-2 flex space-x-2">
                <Badge variant={selectedUser.role === 'pharmacist' ? "default" : "outline"}>
                  {selectedUser.role === 'pharmacist' ? 'Pharmacist' : 'Staff'}
                </Badge>
                <Badge variant={selectedUser.is_active ? "success" : "destructive"}>
                  {selectedUser.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            
            <Tabs defaultValue="personal" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="personal">Personal Details</TabsTrigger>
                <TabsTrigger value="address">Address</TabsTrigger>
                <TabsTrigger value="nextofkin">Next of Kin</TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal" className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground text-center">
                  Personal details will be shown here
                </p>
              </TabsContent>
              
              <TabsContent value="address" className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground text-center">
                  Address information will be shown here
                </p>
              </TabsContent>
              
              <TabsContent value="nextofkin" className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground text-center">
                  Next of kin information will be shown here
                </p>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setUserDetailsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PharmacyStaff;
