
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { TeamMember } from './types';

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
        // Fixed type issue by explicitly mapping to TeamMember interface
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

  return {
    teamMembers,
    loading
  };
};
