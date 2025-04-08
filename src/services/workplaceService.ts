
import { supabase } from "@/lib/supabase";
import { Workplace, WorkplaceType } from "@/types/workplace";
import { safeSelectData } from "@/lib/typeUtils";

/**
 * Fetches all available workplaces
 */
export const fetchAllWorkplaces = async (): Promise<Workplace[]> => {
  try {
    // Use a raw query to avoid TypeScript errors since 'workplaces' is a new table
    const { data, error } = await supabase
      .from('workplaces')
      .select('*')
      .order('name')
      .returns<Workplace[]>();
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching workplaces:', error);
    return [];
  }
};

/**
 * Fetches a workplace by ID
 */
export const fetchWorkplaceById = async (id: string): Promise<Workplace | null> => {
  try {
    // Use a raw query with explicit return type
    const { data, error } = await supabase
      .from('workplaces')
      .select('*')
      .eq('id', id)
      .single()
      .returns<Workplace>();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error fetching workplace with ID ${id}:`, error);
    return null;
  }
};

/**
 * Fetches all workplaces for a doctor
 */
export const fetchDoctorWorkplaces = async (userId: string): Promise<Workplace[]> => {
  try {
    // Simplify by using a direct SQL approach that avoids complex type instantiations
    const { data: doctorWorkplaces, error: joinError } = await supabase
      .from('doctor_workplaces')
      .select('workplace_id, is_primary')
      .eq('user_id', userId);
      
    if (joinError) throw joinError;
    
    // If no workplaces are found, return empty array
    if (!doctorWorkplaces || doctorWorkplaces.length === 0) {
      return [];
    }
    
    // Extract workplace IDs
    const workplaceIds = doctorWorkplaces.map(item => item.workplace_id);
    
    // Fetch the actual workplace data
    const { data: workplacesData, error: workplacesError } = await supabase
      .from('workplaces')
      .select('*')
      .in('id', workplaceIds);
      
    if (workplacesError) throw workplacesError;
    
    // Create a map for quick lookup of primary status
    const isPrimaryMap = new Map();
    doctorWorkplaces.forEach(item => {
      if (item.workplace_id) {
        isPrimaryMap.set(item.workplace_id, item.is_primary || false);
      }
    });
    
    // Attach the is_primary flag to each workplace
    return (workplacesData || []).map(workplace => ({
      ...workplace,
      is_primary: isPrimaryMap.get(workplace.id) || false
    })) as Workplace[];
  } catch (error) {
    console.error(`Error fetching workplaces for doctor ${userId}:`, error);
    return [];
  }
};

/**
 * Fetches the primary workplace for a doctor
 */
export const fetchPrimaryWorkplace = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('doctor_workplaces')
      .select('workplace_id')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .single();
      
    if (error) throw error;
    
    return data?.workplace_id || null;
  } catch (error) {
    console.error(`Error fetching primary workplace for user ${userId}:`, error);
    return null;
  }
};

/**
 * Updates the primary workplace for a doctor
 */
export const updatePrimaryWorkplace = async (userId: string, workplaceId: string): Promise<boolean> => {
  try {
    // First, reset all workplaces to non-primary
    const { error: resetError } = await supabase
      .from('doctor_workplaces')
      .update({ is_primary: false })
      .eq('user_id', userId);
      
    if (resetError) throw resetError;
    
    // Then, set the selected workplace as primary
    const { error } = await supabase
      .from('doctor_workplaces')
      .update({ is_primary: true })
      .eq('user_id', userId)
      .eq('workplace_id', workplaceId);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error updating primary workplace for user ${userId}:`, error);
    return false;
  }
};

/**
 * Adds a workplace for a doctor
 */
export const addDoctorWorkplace = async (userId: string, workplaceId: string, isPrimary: boolean = false): Promise<boolean> => {
  try {
    // If this will be a primary workplace, first reset all others
    if (isPrimary) {
      const { error: resetError } = await supabase
        .from('doctor_workplaces')
        .update({ is_primary: false })
        .eq('user_id', userId);
        
      if (resetError) throw resetError;
    }
    
    // Create the record
    const record = { 
      user_id: userId, 
      workplace_id: workplaceId,
      is_primary: isPrimary,
      created_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('doctor_workplaces')
      .insert([record]);
      
    if (error) {
      // If the workplace already exists, update it
      if (error.code === '23505') { // Unique constraint violation
        const { error: updateError } = await supabase
          .from('doctor_workplaces')
          .update({ is_primary: isPrimary })
          .eq('user_id', userId)
          .eq('workplace_id', workplaceId);
          
        if (updateError) throw updateError;
      } else {
        throw error;
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error adding workplace for doctor ${userId}:`, error);
    return false;
  }
};

/**
 * Removes a workplace for a doctor
 */
export const removeDoctorWorkplace = async (userId: string, workplaceId: string): Promise<boolean> => {
  try {
    // Check if this is the primary workplace
    type WorkplaceCheck = {
      is_primary: boolean;
    };
    
    const { data: primaryCheck, error: checkError } = await supabase
      .from('doctor_workplaces')
      .select('is_primary')
      .eq('user_id', userId)
      .eq('workplace_id', workplaceId)
      .single();

    // Type safe way to check the result
    if (checkError) throw checkError;
    
    // Cast to the expected type
    const isPrimary = primaryCheck ? (primaryCheck as unknown as WorkplaceCheck).is_primary : false;
    
    // Prevent removing the primary workplace if it's the last one
    if (isPrimary) {
      const { data: countCheck, error: countError } = await supabase
        .from('doctor_workplaces')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);
        
      if (countError) throw countError;
      
      if ((countCheck?.length || 0) <= 1) {
        throw new Error('Cannot remove the only workplace. Please add another workplace first.');
      }
    }
    
    // Delete the workplace association
    const { error } = await supabase
      .from('doctor_workplaces')
      .delete()
      .eq('user_id', userId)
      .eq('workplace_id', workplaceId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error removing workplace for doctor ${userId}:`, error);
    return false;
  }
};

/**
 * Creates a new workplace
 */
export const createWorkplace = async (workplace: Omit<Workplace, 'id' | 'created_at' | 'updated_at'>): Promise<Workplace | null> => {
  try {
    // Use a raw query with explicit return type
    const { data, error } = await supabase
      .from('workplaces')
      .insert([workplace])
      .select()
      .single()
      .returns<Workplace>();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error creating workplace:', error);
    return null;
  }
};

/**
 * Updates an existing workplace
 */
export const updateWorkplace = async (
  id: string, 
  workplace: Partial<Omit<Workplace, 'id' | 'created_at' | 'updated_at'>>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workplaces')
      .update(workplace)
      .eq('id', id);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error updating workplace ${id}:`, error);
    return false;
  }
};

/**
 * Gets the appropriate workplace for a doctor based on current time and availability
 */
export const getCurrentWorkplaceByAvailability = async (userId: string): Promise<Workplace | null> => {
  try {
    // Get current day of week (0 = Sunday, 1 = Monday, etc.)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
    
    // Simplify query to avoid deep type instantiation
    const { data: availabilityData, error: availabilityError } = await supabase
      .from('doctor_availability')
      .select('workplace_id')
      .eq('doctor_id', userId)
      .eq('day_of_week', dayOfWeek)
      .lte('start_time', timeString)
      .gte('end_time', timeString);
      
    if (availabilityError) throw availabilityError;
    
    if (availabilityData && availabilityData.length > 0) {
      const workplaceId = availabilityData[0].workplace_id;
      // Get the workplace details
      return await fetchWorkplaceById(workplaceId);
    }
    
    // If no current availability, fall back to primary workplace
    const primaryWorkplaceId = await fetchPrimaryWorkplace(userId);
    if (primaryWorkplaceId) {
      return fetchWorkplaceById(primaryWorkplaceId);
    }
    
    return null;
  } catch (error) {
    console.error('Error determining current workplace:', error);
    return null;
  }
};
