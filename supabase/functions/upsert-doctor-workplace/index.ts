
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

    // Get the current user's session
    const {
      data: { session },
    } = await supabaseClient.auth.getSession()

    if (!session) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

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

    // Security check - ensure user can only update their own data
    if (userId !== session.user.id) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized: You can only update your own workplace',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    console.log(`Calling upsert_doctor_workplace for user ${userId} with workplace ${workplaceId}`)

    // Instead of RPC, use direct SQL query with prepared statement
    const { data, error } = await supabaseClient
      .from('doctor_workplaces')
      .upsert(
        { 
          user_id: userId, 
          workplace_id: workplaceId,
          created_at: new Date().toISOString()
        },
        { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        }
      )

    if (error) {
      console.error('Error updating doctor workplace:', error)
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
