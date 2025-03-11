
import { supabase } from '@/lib/supabase';
import { PharmacyTeamMemberWithProfile } from '@/types/supabase';
import { Database } from '@/integrations/supabase/types';

/**
 * Searches addresses by a given query string.
 * @param query - The search query.
 * @returns Promise<any[]> - A promise that resolves to an array of address suggestions.
 */
export const searchAddressesByQuery = async (query: string): Promise<any[]> => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5`);
    const data = await response.json();

    // Transform the data to match the desired format
    const suggestions = data.map((item: any) => ({
      street: item.address?.road || '',
      city: item.address?.city || item.address?.town || item.address?.village || '',
      postal_code: item.address?.postcode || '',
      country: item.address?.country || '',
      formatted: item.display_name,
    }));

    return suggestions;
  } catch (error) {
    console.error("Error searching addresses:", error);
    return [];
  }
};

/**
 * Soft-deletes a team member by setting the deleted_at timestamp
 * @param userId - The ID of the user/team member to soft delete
 * @returns Promise<boolean> - True if successful, false otherwise
 */
export const softDeleteTeamMember = async (userId: string): Promise<boolean> => {
  try {
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from('pharmacy_team_members')
      .update({ deleted_at: now })
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error soft deleting team member:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception soft deleting team member:', error);
    return false;
  }
};

export const getPharmacyTeamMembers = async (pharmacyId: string): Promise<PharmacyTeamMemberWithProfile[]> => {
  try {
    if (!pharmacyId) {
      console.error('No pharmacy ID provided to getPharmacyTeamMembers');
      throw new Error('Pharmacy ID is required');
    }

    // First, get all team members for this pharmacy
    const { data: teamMembers, error: teamError } = await supabase
      .from('pharmacy_team_members')
      .select('id, user_id, pharmacy_id, role, created_at, deleted_at')
      .eq('pharmacy_id', pharmacyId)
      .is('deleted_at', null);
    
    if (teamError) {
      console.error('Error fetching team members:', teamError);
      throw new Error(`Failed to fetch team members: ${teamError.message}`);
    }

    if (!teamMembers || teamMembers.length === 0) {
      return [];
    }

    // Create a list of user IDs to fetch profiles for
    const userIds = teamMembers.map(member => member.user_id);

    // Fetch all profiles for these user IDs in a single query
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        avatar_url,
        is_blocked,
        role_id,
        date_of_birth,
        city,
        auth_method,
        doctor_stamp_url,
        doctor_signature_url,
        cns_card_front,
        cns_card_back,
        cns_number,
        updated_at,
        license_number
      `)
      .in('id', userIds);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    // Create a map of user_id to profile data for easy lookup
    const profilesMap = new Map();
    if (profilesData) {
      profilesData.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });
    }

    // Now map each team member to include their profile data
    const teamMembersWithProfile: PharmacyTeamMemberWithProfile[] = teamMembers.map(member => {
      // Get the profile from the map or use null values if not found
      const profile = profilesMap.get(member.user_id) || {
        full_name: null,
        email: null,
        avatar_url: null,
        is_blocked: null,
        role_id: null,
        date_of_birth: null,
        city: null,
        auth_method: null,
        doctor_stamp_url: null,
        doctor_signature_url: null,
        cns_card_front: null,
        cns_card_back: null,
        cns_number: null,
        updated_at: null,
        license_number: null
      };

      return {
        id: member.id,
        user_id: member.user_id,
        pharmacy_id: member.pharmacy_id,
        role: member.role,
        created_at: member.created_at,
        deleted_at: member.deleted_at,
        full_name: profile.full_name,
        email: profile.email,
        avatar_url: profile.avatar_url,
        is_active: !profile.is_blocked,
        is_blocked: profile.is_blocked,
        role_id: profile.role_id,
        date_of_birth: profile.date_of_birth,
        city: profile.city,
        auth_method: profile.auth_method,
        doctor_stamp_url: profile.doctor_stamp_url,
        doctor_signature_url: profile.doctor_signature_url,
        cns_card_front: profile.cns_card_front,
        cns_card_back: profile.cns_card_back,
        cns_number: profile.cns_number,
        updated_at: profile.updated_at,
        license_number: profile.license_number
      };
    });
    
    return teamMembersWithProfile;
  } catch (error) {
    console.error('Error in getPharmacyTeamMembers:', error);
    throw error;
  }
};
