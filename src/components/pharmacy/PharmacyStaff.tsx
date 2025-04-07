
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@/hooks/auth/useAuth';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRecoilValue } from 'recoil';
import { userAvatarState } from '@/store/user/atoms';
import StaffMemberList from './staff/StaffMemberList';
import StaffEmptyState from './staff/StaffEmptyState';
import { StaffMember } from './staff/types';
import { Button } from "@/components/ui/button";
import { UserPlus, LayoutList, LayoutGrid } from 'lucide-react';
import { TeamMemberDialog } from './team/TeamMemberDialog';

interface PharmacyStaffProps {
  pharmacyId: string;
  entityType?: 'doctor' | 'pharmacy';
}

const PharmacyStaff: React.FC<PharmacyStaffProps> = ({ pharmacyId, entityType = 'pharmacy' }) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [nokPhoneValue, setNokPhoneValue] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const { profile } = useAuth();
  const userAvatar = useRecoilValue(userAvatarState);

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
          avatar_url: profile.avatar_url,
          user_id: profile.id
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
              avatar_url,
              is_blocked
            )
          `)
          .eq('pharmacy_id', pharmacyId)
          .is('deleted_at', null);
        
        if (error) throw error;
        
        // Always include the current user/pharmacist if they aren't in the results
        const formattedStaff: StaffMember[] = [];
        
        // Add fetched team members
        if (data) {
          data.forEach((item: any) => {
            if (item.profiles) {
              formattedStaff.push({
                id: item.id,
                full_name: item.profiles.full_name || 'Unknown',
                email: item.profiles.email || '',
                role: item.profiles.role || 'staff',
                status: item.profiles.is_blocked ? 'inactive' : 'active',
                avatar_url: item.profiles.avatar_url,
                user_id: item.profiles.id
              });
            }
          });
        }
        
        // Add the current user if they're not already in the list
        if (profile && !formattedStaff.some(member => member.email === profile.email)) {
          formattedStaff.unshift({
            id: profile.id || 'current-user',
            full_name: profile.full_name || 'Current User',
            email: profile.email || '',
            role: profile.role || 'pharmacist',
            status: 'active',
            avatar_url: profile.avatar_url,
            user_id: profile.id
          });
        }
        
        setStaff(formattedStaff);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      
      // Always include the current user in case of an error
      if (profile) {
        setStaff([{
          id: profile.id || 'current-user',
          full_name: profile.full_name || 'Current User',
          email: profile.email || '',
          role: profile.role || (entityType === 'doctor' ? 'doctor' : 'pharmacist'),
          status: 'active',
          avatar_url: profile.avatar_url,
          user_id: profile.id
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleStaffStatus = async (staffId: string, currentStatus: 'active' | 'inactive') => {
    try {
      // Determine new status
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const isActive = newStatus === 'active';
      
      // Update in the database
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: !isActive })
        .eq('id', staffId);
        
      if (error) throw error;
      
      // Update local state
      setStaff(prev => 
        prev.map(member => 
          member.user_id === staffId 
            ? { ...member, status: newStatus } 
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
      variant: "destructive"
    });
  };

  const handleAddMember = async (values: any) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password || 'temporary' + Math.random().toString(36).slice(2, 10),
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

      toast({
        title: "Success",
        description: "New team member added successfully",
      });

      setDialogOpen(false);
      fetchStaff();
    } catch (error) {
      console.error('Error adding new user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add new team member",
      });
    }
  };

  const StaffCardView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {staff.map(member => (
        <Card key={member.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                {member.avatar_url ? (
                  <img 
                    src={member.avatar_url} 
                    alt={member.full_name} 
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <span className="text-lg font-semibold">
                    {member.full_name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-medium">{member.full_name}</h3>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm">
                <span className={`px-2 py-1 rounded-full text-xs ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {member.status}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleViewMember(member.user_id)}
              >
                View Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <Card className="shadow-none border-0">
      <CardContent className="p-0">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'list' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="h-4 w-4 mr-1" /> List
            </Button>
            <Button
              variant={viewMode === 'card' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('card')}
            >
              <LayoutGrid className="h-4 w-4 mr-1" /> Cards
            </Button>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Team Member
          </Button>
        </div>
        
        {loading ? (
          <div className="text-center py-6">Loading staff...</div>
        ) : staff.length === 0 ? (
          <StaffEmptyState onAddStaff={() => setDialogOpen(true)} />
        ) : (
          <TooltipProvider>
            {viewMode === 'list' ? (
              <StaffMemberList 
                staff={staff}
                currentUserId={profile?.id}
                userAvatar={userAvatar}
                onViewMember={handleViewMember}
                onEditMember={handleEditMember}
                onTerminateMember={handleTerminateMember}
                onToggleActive={toggleStaffStatus}
              />
            ) : (
              <StaffCardView />
            )}
          </TooltipProvider>
        )}
      </CardContent>
      
      <TeamMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleAddMember}
        phoneValue={phoneValue}
        setPhoneValue={setPhoneValue}
        nokPhoneValue={nokPhoneValue}
        setNokPhoneValue={setNokPhoneValue}
        entityType={entityType}
        showAllTabs={false}
      />
    </Card>
  );
};

export default PharmacyStaff;
