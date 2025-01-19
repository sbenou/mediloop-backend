import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoginEmailRequest {
  email: string;
  otp: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('=== Starting Email Send Process ===');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp } = await req.json() as LoginEmailRequest;
    console.log('Received request:', { email, otp });

    if (!RESEND_API_KEY) {
      console.error('Configuration Error: RESEND_API_KEY is not set');
      throw new Error('Email service configuration error');
    }

    console.log('Preparing email content...');
    const emailContent = `
      <h1>Your Login Code</h1>
      <p>Here is your one-time login code: <strong>${otp}</strong></p>
      <p>This code will expire in 5 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    `;

    console.log('Making request to Resend API...');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Pharmacy App <login@resend.dev>',
        to: [email],
        subject: 'Your Login Code',
        html: emailContent,
      }),
    });

    const responseText = await res.text();
    console.log('Resend API Response:', {
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries()),
      body: responseText
    });

    if (!res.ok) {
      throw new Error(`Failed to send email: ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log('Email sent successfully:', data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in send-login-email function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};

serve(handler);