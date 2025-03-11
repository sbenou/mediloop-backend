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

    const { data, error } = await supabase
      .from('pharmacy_team_members')
      .select(`
        id,
        user_id,
        pharmacy_id,
        role,
        created_at,
        deleted_at,
        profiles:user_id (
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
        )
      `)
      .eq('pharmacy_id', pharmacyId)
      .is('deleted_at', null);
    
    if (error) {
      console.error('Error fetching team members:', error);
      throw new Error(`Failed to fetch team members: ${error.message}`);
    }

    const teamMembers: PharmacyTeamMemberWithProfile[] = data.map(member => {
      const profile = member.profiles || {};
      return {
        id: member.id,
        user_id: member.user_id,
        pharmacy_id: member.pharmacy_id,
        role: member.role,
        created_at: member.created_at,
        deleted_at: member.deleted_at,
        full_name: profile.full_name || null,
        email: profile.email || null,
        avatar_url: profile.avatar_url || null,
        is_active: !profile.is_blocked,
        is_blocked: profile.is_blocked || false,
        role_id: profile.role_id || null,
        date_of_birth: profile.date_of_birth || null,
        city: profile.city || null,
        auth_method: profile.auth_method || null,
        doctor_stamp_url: profile.doctor_stamp_url || null,
        doctor_signature_url: profile.doctor_signature_url || null,
        cns_card_front: profile.cns_card_front || null,
        cns_card_back: profile.cns_card_back || null,
        cns_number: profile.cns_number || null,
        updated_at: profile.updated_at || null,
        license_number: profile.license_number || null
      };
    });
    
    return teamMembers;
  } catch (error) {
    console.error('Error in getPharmacyTeamMembers:', error);
    throw error;
  }
};
