
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

export interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  role: string;
  is_active: boolean;
  phone_number?: string;
}

export const useProfessionalTeam = (entityId: string, entityType: 'doctor' | 'pharmacy') => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, [entityId, entityType]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      
      if (entityType === 'pharmacy') {
        // For pharmacy, we can use the existing user_pharmacies table
        const { data: pharmacyUsers, error: pharmacyError } = await supabase
          .from('user_pharmacies')
          .select('user_id')
          .eq('pharmacy_id', entityId);
        
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
            phone_number: undefined,
          }));
          
          setTeamMembers(members);
        }
      } else {
        // For doctor, we'll simulate similar behavior but with a placeholder
        // In a real implementation, you'd use a user_doctors table
        console.log("Doctor team support coming soon");
        
        // For now, return an empty array to avoid errors
        setTeamMembers([]);
      }
    } catch (error) {
      console.error(`Error fetching ${entityType} team members:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load ${entityType} team members`,
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
