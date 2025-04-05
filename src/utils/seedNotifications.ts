import { supabase } from "@/lib/supabase";

export async function seedUserNotifications(userId: string) {
  try {
    console.log("Seeding notifications for user:", userId);
    
    // Call the seed-notifications edge function which bypasses RLS
    const { data, error } = await supabase.functions.invoke('seed-notifications', {
      body: { user_id: userId }
    });

    if (error) {
      console.error('Error seeding notifications:', error);
      return { success: false, error };
    }

    return { 
      success: true, 
      count: data?.count || 0,
      message: `${data?.count || 0} notifications created for user ${userId}`
    };
  } catch (error) {
    console.error('Error seeding notifications:', error);
    return { success: false, error };
  }
}
