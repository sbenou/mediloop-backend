
import { supabase } from "@/lib/supabase";

export async function seedUserNotifications(userId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('seed-notifications', {
      body: { user_id: userId }
    });

    if (error) {
      console.error('Error seeding notifications:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error seeding notifications:', error);
    return null;
  }
}
