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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp } = await req.json() as LoginEmailRequest;
    console.log('Processing login email request:', { email, otp });

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set');
      throw new Error('Email service configuration error');
    }

    console.log('Sending email via Resend API');
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
        html: `
          <h1>Your Login Code</h1>
          <p>Here is your one-time login code: <strong>${otp}</strong></p>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        `,
      }),
    });

    const responseData = await res.text();
    console.log('Resend API response:', { status: res.status, data: responseData });

    if (!res.ok) {
      console.error('Resend API error:', responseData);
      throw new Error(`Failed to send email: ${responseData}`);
    }

    const data = JSON.parse(responseData);
    console.log('Email sent successfully:', data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error in send-login-email function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};

serve(handler);