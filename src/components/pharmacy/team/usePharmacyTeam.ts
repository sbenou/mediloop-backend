
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { TeamMember, FormData } from './types';
import * as z from 'zod';

export const usePharmacyTeam = (pharmacyId: string) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [nokPhoneValue, setNokPhoneValue] = useState('');

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

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      // Note: we're toggling the is_blocked flag which is the opposite of is_active
      // so we need to negate isActive when setting is_blocked
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: isActive })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
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

  const handleAddMember = async (values: z.infer<any>) => {
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
          street: values.next_of_kin_street,
          city: values.next_of_kin_city,
          postal_code: values.next_of_kin_postal_code,
          country: values.next_of_kin_country,
        });

      if (nextOfKinError) throw nextOfKinError;

      toast({
        title: "Success",
        description: "New team member added successfully",
      });

      setAddUserOpen(false);
      setPhoneValue('');
      setNokPhoneValue('');
      await fetchTeamMembers();
    } catch (error) {
      console.error('Error adding new user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add new team member",
      });
    }
  };

  return {
    teamMembers,
    loading,
    addUserOpen,
    setAddUserOpen,
    handleToggleActive,
    handleAddMember,
    phoneValue,
    setPhoneValue,
    nokPhoneValue,
    setNokPhoneValue
  };
};
