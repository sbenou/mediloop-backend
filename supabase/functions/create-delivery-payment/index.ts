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

  try {
    // Get the session or user object
    const authHeader = req.headers.get('Authorization')!
    console.log('Auth header present:', !!authHeader);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    console.log('Auth check result:', { user: !!user, error: authError });

    if (authError || !user?.email) {
      throw new Error('Unauthorized or no email found')
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Parse the request body
    const { items, comment } = await req.json()
    console.log('Processing items:', items);

    // Create line items with explicit currency
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'eur', // Set currency to EUR
        product_data: {
          name: item.name,
          images: item.image_url ? [item.image_url] : undefined,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }))

    // Add delivery fee as a separate line item with explicit currency
    const deliveryFee = {
      price_data: {
        currency: 'eur', // Set currency to EUR
        product_data: {
          name: 'Delivery Fee',
        },
        unit_amount: 500, // 5.00€ delivery fee
      },
      quantity: 1,
    }

    lineItems.push(deliveryFee)

    console.log('Creating checkout session...')
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: lineItems,
      mode: 'payment',
      metadata: {
        comment: comment || '',
      },
      success_url: `${req.headers.get('origin')}/my-orders?payment=success`,
      cancel_url: `${req.headers.get('origin')}/my-orders?payment=cancelled`,
    })

    console.log('Checkout session created:', session.id)
    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})