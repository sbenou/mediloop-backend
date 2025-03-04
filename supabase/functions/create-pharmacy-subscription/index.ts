
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  )

  try {
    // Get the session or user object
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data } = await supabaseClient.auth.getUser(token)
    const user = data.user
    const email = user?.email

    if (!email) {
      throw new Error('No email found')
    }

    // Verify user is a pharmacist
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'pharmacist') {
      throw new Error('Only pharmacists can subscribe to this plan')
    }

    // Get pharmacy ID associated with this user
    const { data: userPharmacy } = await supabaseClient
      .from('user_pharmacies')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    const pharmacyId = userPharmacy?.pharmacy_id
    if (!pharmacyId) {
      throw new Error('No pharmacy associated with this user')
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    })

    let customer_id = undefined
    if (customers.data.length > 0) {
      customer_id = customers.data[0].id
      // Check if already subscribed
      const subscriptions = await stripe.subscriptions.list({
        customer: customers.data[0].id,
        status: 'active',
        price: 'price_1QfDc2A1DaoRGs36hsqAfkEG',
        limit: 1
      })

      if (subscriptions.data.length > 0) {
        // If already subscribed, make sure the pharmacy is marked as endorsed
        const { data: updateResult, error: updateError } = await supabaseClient
          .from('pharmacies')
          .update({ endorsed: true })
          .eq('id', pharmacyId)

        if (updateError) {
          console.error('Error updating pharmacy endorsed status:', updateError)
        } else {
          console.log('Pharmacy already has active subscription, endorsed status updated')
        }

        throw new Error("Already subscribed to the Pharmacy Partner Plan")
      }
    }

    console.log('Creating pharmacy subscription session...')
    const session = await stripe.checkout.sessions.create({
      customer: customer_id,
      customer_email: customer_id ? undefined : email,
      line_items: [
        {
          price: 'price_1QfDc2A1DaoRGs36hsqAfkEG', // Pharmacy Partner Plan
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/settings?subscription=success&pharmacy_id=${pharmacyId}`,
      cancel_url: `${req.headers.get('origin')}/settings?subscription=cancelled`,
      metadata: {
        pharmacy_id: pharmacyId,
        user_id: user.id
      }
    })

    // Send confirmation email
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-order-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          type: 'subscription',
          email: email,
          details: {
            pharmacy_id: pharmacyId
          }
        })
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't throw here, we still want to return the checkout session
    }

    console.log('Subscription session created:', session.id)
    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating subscription session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
