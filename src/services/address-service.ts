
import { supabase } from '@/lib/supabase';

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

/**
 * Gets pharmacy team members for a given pharmacy ID
 * @param pharmacyId - The ID of the pharmacy
 * @returns Promise containing team members with their profiles
 */
export const getPharmacyTeamMembers = async (pharmacyId: string) => {
  try {
    // Get all team members for this pharmacy that haven't been deleted
    const { data: teamMembers, error: teamError } = await supabase
      .from('pharmacy_team_members')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .is('deleted_at', null);
    
    if (teamError) {
      console.error('Error fetching team members:', teamError);
      throw new Error('Failed to fetch team members');
    }
    
    if (!teamMembers || teamMembers.length === 0) {
      return [];
    }
    
    // Extract user IDs to get their profiles
    const userIds = teamMembers.map(member => member.user_id);
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, role, is_blocked')
      .in('id', userIds);
      
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw new Error('Failed to fetch user profiles');
    }
    
    // Combine team members with their profile data
    const membersWithProfiles = teamMembers.map(teamMember => {
      const profile = profiles?.find(p => p.id === teamMember.user_id);
      return {
        ...teamMember,
        full_name: profile?.full_name || 'Unknown',
        email: profile?.email || 'No email',
        avatar_url: profile?.avatar_url,
        is_active: profile ? !profile.is_blocked : true
      };
    });
    
    return membersWithProfiles;
  } catch (error) {
    console.error('Error in getPharmacyTeamMembers:', error);
    throw error;
  }
};
