import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const CURRENCY_API_KEY = Deno.env.get('CURRENCY_API_KEY')
    if (!CURRENCY_API_KEY) {
      throw new Error('Missing CURRENCY_API_KEY')
    }

    const response = await fetch(
      'https://api.freecurrencyapi.com/v1/latest?base_currency=USD',
      {
        headers: {
          'apikey': CURRENCY_API_KEY
        }
      }
    )

    const data = await response.json()
    console.log('Currency API response:', data)

    if (!data.data) {
      throw new Error('Invalid response from currency API')
    }

    // Format the response to include currency names and symbols
    const currencyInfo = {
      USD: { name: 'US Dollar', symbol: '$' },
      EUR: { name: 'Euro', symbol: '€' },
      GBP: { name: 'British Pound', symbol: '£' },
      JPY: { name: 'Japanese Yen', symbol: '¥' },
      AUD: { name: 'Australian Dollar', symbol: 'A$' },
      CAD: { name: 'Canadian Dollar', symbol: 'C$' },
      CHF: { name: 'Swiss Franc', symbol: 'CHF' },
      CNY: { name: 'Chinese Yuan', symbol: '¥' },
      INR: { name: 'Indian Rupee', symbol: '₹' },
    }

    const currencies = Object.entries(data.data).map(([code, rate]) => ({
      code: code.toLowerCase(),
      rate: Number(rate),
      name: currencyInfo[code]?.name || code,
      symbol: currencyInfo[code]?.symbol || code,
    }))

    return new Response(
      JSON.stringify({ currencies }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})