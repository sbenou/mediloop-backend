
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

    // Use the Supabase RPC function which returns the data in the required format
    const { data, error } = await supabase
      .rpc('get_pharmacy_team_members', { pharmacy_id_param: pharmacyId });
    
    if (error) {
      console.error('Error fetching team members:', error);
      throw new Error(`Failed to fetch team members: ${error.message}`);
    }

    // The returned data is an array of JSON objects that we need to parse into our type
    const teamMembers: PharmacyTeamMemberWithProfile[] = (data || []).map((member: any) => {
      return {
        id: member.id,
        user_id: member.user_id,
        pharmacy_id: member.pharmacy_id,
        role: member.role,
        created_at: member.created_at,
        deleted_at: member.deleted_at,
        full_name: member.full_name || null,
        email: member.email || null,
        avatar_url: member.avatar_url || null,
        is_active: member.is_active || false,
        is_blocked: member.is_blocked || false,
        role_id: member.role_id || null,
        date_of_birth: member.date_of_birth || null,
        city: member.city || null,
        auth_method: member.auth_method || null,
        doctor_stamp_url: member.doctor_stamp_url || null,
        doctor_signature_url: member.doctor_signature_url || null,
        cns_card_front: member.cns_card_front || null,
        cns_card_back: member.cns_card_back || null,
        cns_number: member.cns_number || null,
        updated_at: member.updated_at || null,
        license_number: member.license_number || null
      };
    });
    
    return teamMembers;
  } catch (error) {
    console.error('Error in getPharmacyTeamMembers:', error);
    throw error;
  }
};
