
// Follow Supabase Edge Function patterns
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.16';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate mock health data based on device type
const generateMockHealthData = (deviceType: string) => {
  const baseData = {
    steps: Math.floor(Math.random() * 10000) + 1000,
    heart_rate: Math.floor(Math.random() * 30) + 60,
    calories_burned: Math.floor(Math.random() * 500) + 100,
    sleep_hours: (Math.floor(Math.random() * 4) + 5) + (Math.random() * 0.9),
    active_minutes: Math.floor(Math.random() * 120) + 30,
  };

  // Add device-specific metrics
  switch (deviceType) {
    case 'apple_watch':
      return {
        ...baseData,
        oxygen_level: Math.floor(Math.random() * 3) + 96,
        stand_hours: Math.floor(Math.random() * 8) + 8,
      };
    case 'fitbit':
      return {
        ...baseData,
        floors_climbed: Math.floor(Math.random() * 20) + 5,
        distance_km: (Math.random() * 5 + 2).toFixed(1),
      };
    case 'oura_ring':
      return {
        ...baseData,
        temperature: (36.5 + Math.random() * 0.8).toFixed(1),
        readiness_score: Math.floor(Math.random() * 30) + 70,
        sleep_quality: Math.floor(Math.random() * 30) + 70,
      };
    default:
      return baseData;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }
    
    // Extract JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }
    
    // Get request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }
    
    const { wearableId } = body;
    
    if (!wearableId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: wearableId' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }
    
    // Get wearable info
    const { data: wearable, error: wearableError } = await supabase
      .from('user_wearables')
      .select('*')
      .eq('id', wearableId)
      .eq('user_id', user.id)
      .single();
      
    if (wearableError || !wearable) {
      return new Response(
        JSON.stringify({ error: 'Wearable not found or access denied' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }
    
    // In a real implementation, you would fetch data from the wearable's API
    // using the stored access_token and refresh_token
    
    // For this demo, generate mock health data
    const healthData = generateMockHealthData(wearable.device_type);
    
    // Update wearable with new data
    const { error: updateError } = await supabase
      .from('user_wearables')
      .update({
        last_synced: new Date().toISOString(),
        battery_level: Math.floor(Math.random() * 100),
        meta: {
          ...wearable.meta,
          last_sync_data: healthData,
        }
      })
      .eq('id', wearableId);
      
    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update wearable data' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Wearable data synced successfully',
        data: healthData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
    
  } catch (error) {
    console.error('Error in sync-wearable-data function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
