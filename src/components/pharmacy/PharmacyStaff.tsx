
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

interface PharmacyStaffProps {
  pharmacyId: string;
  entityType?: 'doctor' | 'pharmacy';
}

const PharmacyStaff: React.FC<PharmacyStaffProps> = ({ pharmacyId, entityType = 'pharmacy' }) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  return (
    <Card className="shadow-none border-0">
      <CardContent className="p-0">
        {loading ? (
          <div className="text-center py-6">Loading staff...</div>
        ) : staff.length === 0 ? (
          <StaffEmptyState onAddStaff={() => setDialogOpen(true)} />
        ) : (
          <TooltipProvider>
            <StaffMemberList 
              staff={staff}
              currentUserId={profile?.id}
              userAvatar={userAvatar}
              onViewMember={handleViewMember}
              onEditMember={handleEditMember}
              onTerminateMember={handleTerminateMember}
              onToggleActive={toggleStaffStatus}
            />
          </TooltipProvider>
        )}
      </CardContent>

      {/* Removed the "Add Staff Member" button here as it's redundant */}
    </Card>
  );
};

export default PharmacyStaff;
