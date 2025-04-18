
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { points } = await req.json()
    if (!points || points <= 0) {
      throw new Error('Invalid points amount')
    }

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (userError || !user) throw new Error('Error getting user')

    // Get user's current points
    const { data: loyaltyData, error: loyaltyError } = await supabaseAdmin
      .from('user_points')
      .select('available_points, wallet_balance')
      .eq('user_id', user.id)
      .single()
    
    if (loyaltyError || !loyaltyData) {
      throw new Error('Error getting user points')
    }

    if (points > loyaltyData.available_points) {
      throw new Error('Insufficient points')
    }

    // Calculate amount in cents (100 points = €1.00)
    const amountInCents = Math.floor(points / 100 * 100)

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Create or get customer
    let customerId: string
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    })

    if (customers.data.length > 0) {
      customerId = customers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
      })
      customerId = customer.id
    }

    // Add funds to customer balance
    await stripe.customers.update(customerId, {
      balance: -amountInCents, // Negative because it's a credit
    })

    // Update user points and wallet balance in Supabase
    const { error: updateError } = await supabaseAdmin
      .from('user_points')
      .update({
        available_points: loyaltyData.available_points - points,
        wallet_balance: loyaltyData.wallet_balance + (points / 100),
      })
      .eq('user_id', user.id)

    if (updateError) {
      throw new Error('Error updating user points')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully converted ${points} points to €${(points / 100).toFixed(2)}`,
        newBalance: loyaltyData.wallet_balance + (points / 100)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
