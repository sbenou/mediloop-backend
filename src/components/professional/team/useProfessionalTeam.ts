
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
      
      // Determine which relation table to use based on entity type
      const relationTable = entityType === 'doctor' ? 'user_doctors' : 'user_pharmacies';
      const entityIdColumn = entityType === 'doctor' ? 'doctor_id' : 'pharmacy_id';
      
      // Fetch users associated with this professional entity
      const { data: entityUsers, error: entityError } = await supabase
        .from(relationTable)
        .select('user_id')
        .eq(entityIdColumn, entityId);
      
      if (entityError) throw entityError;
      
      if (!entityUsers || entityUsers.length === 0) {
        setTeamMembers([]);
        return;
      }
      
      const userIds = entityUsers.map(eu => eu.user_id);
      
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
          role: profile.role || (entityType === 'doctor' ? 'doctor_staff' : 'pharmacy_user'),
          is_active: !profile.is_blocked,
        }));
        
        setTeamMembers(members);
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
