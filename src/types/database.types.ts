import { Database as DatabaseGenerated } from '@/integrations/supabase/types';

export type Database = DatabaseGenerated;

// Export commonly used table types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Export commonly used enum types
export type ConnectionStatus = Enums<'connection_status'>;
export type OrderStatus = Enums<'order_status'>;
export type PrescriptionStatus = Enums<'prescription_status'>;