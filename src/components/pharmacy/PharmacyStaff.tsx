
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { UserPlus, UserCheck, UserX, Shield, Eye, Edit, Trash } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@/hooks/auth/useAuth';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { TeamMemberDialog } from './team/TeamMemberDialog';

interface PharmacyStaffProps {
  pharmacyId: string;
  entityType?: 'doctor' | 'pharmacy';
}

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  avatar_url?: string;
}

const PharmacyStaff: React.FC<PharmacyStaffProps> = ({ pharmacyId, entityType = 'pharmacy' }) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [nokPhoneValue, setNokPhoneValue] = useState('');
  const { profile } = useAuth();

  useEffect(() => {
    fetchStaff();
  }, [pharmacyId]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      
      if (entityType === 'doctor' && profile) {
        // For doctor view, just show the doctor (profile) as main staff
        setStaff([{
          id: profile.id || '',
          full_name: profile.full_name || 'Doctor',
          email: profile.email || '',
          role: 'doctor',
          status: 'active',
          avatar_url: profile.avatar_url
        }]);
      } else {
        // For pharmacy view, fetch staff from pharmacy team members
        const { data, error } = await supabase
          .from('pharmacy_team_members')
          .select(`
            id,
            profiles:user_id (
              id,
              full_name,
              email,
              role,
              avatar_url
            )
          `)
          .eq('pharmacy_id', pharmacyId)
          .is('deleted_at', null);
        
        if (error) throw error;
        
        if (data) {
          const formattedStaff: StaffMember[] = data.map((item: any) => ({
            id: item.id,
            full_name: item.profiles?.full_name || 'Unknown',
            email: item.profiles?.email || '',
            role: item.profiles?.role || 'staff',
            status: 'active',
            avatar_url: item.profiles?.avatar_url
          }));
          
          setStaff(formattedStaff);
        }
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load staff members.",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleStaffStatus = async (staffId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      // In a real app, update the database
      // For now, just update the local state
      setStaff(prev => 
        prev.map(member => 
          member.id === staffId 
            ? { ...member, status: newStatus as 'active' | 'inactive' } 
            : member
        )
      );
      
      toast({
        title: "Status Updated",
        description: `Staff member ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      console.error('Error toggling staff status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update staff status.",
      });
    }
  };

  const handleAddStaff = (data: any) => {
    console.log('Adding new staff member:', data);
    toast({
      title: "Staff Member Added",
      description: `${data.full_name} has been added to your team.`,
    });
    setDialogOpen(false);
    setPhoneValue('');
    setNokPhoneValue('');
  };

  const handleViewMember = (memberId: string) => {
    toast({
      title: "View Member",
      description: `Viewing details for team member ID: ${memberId}`,
    });
  };

  const handleEditMember = (memberId: string) => {
    toast({
      title: "Edit Member",
      description: `Editing team member ID: ${memberId}`,
    });
  };

  const handleTerminateMember = (memberId: string) => {
    toast({
      title: "Confirm Termination",
      description: `Are you sure you want to terminate this team member?`,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Staff Management</CardTitle>
          {entityType === 'pharmacy' && (
            <Button onClick={() => setDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-6">Loading staff...</div>
        ) : staff.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No staff members found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                {entityType === 'pharmacy' && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>{member.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{member.full_name}</span>
                        {member.role === 'doctor' && (
                          <Badge variant="outline" className="mt-1 bg-blue-50 border-blue-200 text-blue-700">
                            <Shield className="h-3 w-3 mr-1" /> Main Doctor
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      member.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                      member.role === 'pharmacist' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.status === 'active' ? 'success' : 'destructive'}>
                      {member.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  {entityType === 'pharmacy' && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewMember(member.id)}>
                            <Eye className="h-4 w-4 mr-2" /> View Team Member
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditMember(member.id)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit Team Member
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive" 
                            onClick={() => handleTerminateMember(member.id)}
                          >
                            <Trash className="h-4 w-4 mr-2" /> Terminate Team Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <TeamMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleAddStaff}
        phoneValue={phoneValue}
        setPhoneValue={setPhoneValue}
        nokPhoneValue={nokPhoneValue}
        setNokPhoneValue={setNokPhoneValue}
        entityType={entityType}
      />
    </Card>
  );
};

export default PharmacyStaff;
