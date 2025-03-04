
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

  const stripeSignature = req.headers.get('stripe-signature')
  if (!stripeSignature) {
    return new Response(
      JSON.stringify({ error: 'Stripe signature missing' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Get the raw request body
    const body = await req.text()
    
    // Construct the event using the signature
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    let event

    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(body, stripeSignature, webhookSecret)
      } else {
        // Fallback for development or when webhook secret is not set
        event = JSON.parse(body)
        console.warn('Webhook secret not set, proceeding with unverified event')
      }
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log(`Event received: ${event.type}`)

    // Handle different event types
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      
      // Get pharmacy ID from metadata
      const pharmacyId = session.metadata?.pharmacy_id
      
      if (pharmacyId) {
        // Connect to Supabase
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
        
        // Update pharmacy endorsed status
        const { data, error } = await supabaseAdmin
          .from('pharmacies')
          .update({ endorsed: true })
          .eq('id', pharmacyId)
          .select()
        
        if (error) {
          console.error('Error updating pharmacy endorsed status:', error)
          throw new Error('Error updating pharmacy status')
        }
        
        console.log(`Pharmacy ${pharmacyId} marked as endorsed successfully`)
      } else {
        console.warn('No pharmacy ID in session metadata:', session.metadata)
      }
    } else if (event.type === 'customer.subscription.deleted') {
      // Handle subscription cancellation - would need to find the pharmacy based on customer ID
      console.log('Subscription deleted, pharmacy should be marked as not endorsed')
      
      // This would require additional database lookups to find which pharmacy 
      // is associated with this subscription
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
