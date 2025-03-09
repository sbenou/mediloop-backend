
// Supabase Edge Function: upsert-doctor-workplace
// This function serves as a bridge to call the upsert_doctor_workplace database function

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.16'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the request body
    const { userId, workplaceId } = await req.json()

    // Validate input
    if (!userId || !workplaceId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters: userId and workplaceId are required',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log(`Calling upsert_doctor_workplace for user ${userId} with workplace ${workplaceId}`)

    // Call the database function
    const { data, error } = await supabaseClient.rpc(
      'upsert_doctor_workplace',
      {
        p_user_id: userId,
        p_workplace_id: workplaceId,
      }
    )

    if (error) {
      console.error('Error calling upsert_doctor_workplace:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Return the success response
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
