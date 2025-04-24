
export interface UserWearable {
  id: string;
  device_type: string;
  device_name: string;
  device_id: string;
  connection_status: string;
  last_synced: string | null;
  battery_level: number | null;
  meta?: any;
  created_at: string;
  updated_at: string;
}

export interface AvailableWearable {
  id: string;
  name: string;
  description: string;
  features?: string[];
  connectionMethod: 'oauth' | 'direct' | 'manual';
  oauthUrl?: string;
}

export interface WearableData {
  steps: number | null;
  heartRate: number | null;
  caloriesBurned: number | null;
  sleepHours: number | null;
  oxygenLevel?: number | null;
  temperature?: number | null;
}
