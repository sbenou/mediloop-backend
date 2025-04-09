
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { TeamMember, TeamMemberStatus } from './types';

export const usePharmacyTeam = (pharmacyId: string) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

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
        // Map to TeamMember type with proper status handling
        const members: TeamMember[] = profiles.map(profile => ({
          id: profile.id,
          full_name: profile.full_name || 'Unknown',
          email: profile.email || 'No email',
          phone_number: undefined,
          role: profile.role || 'pharmacy_user',
          pharmacy_id: pharmacyId,
          doctor_id: undefined,
          status: !profile.is_blocked ? 'active' : 'inactive' as TeamMemberStatus,
          profile_image: profile.avatar_url,
          isAvailable: !profile.is_blocked, // Set availability based on blocked status
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

  return {
    teamMembers,
    loading
  };
};
