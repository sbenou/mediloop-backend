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

    // Replace the token placeholder in the HTML template
    const emailContent = `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 20px; background-color: #f4f4f5; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #18181b; font-size: 24px; margin: 0;">Your Login Code</h1>
            </div>

            <!-- Main Content -->
            <div style="color: #52525b; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
                <p>Hello,</p>
                <p>Here is your login code to access your account:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <div style="font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 4px; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
                        ${otp}
                    </div>
                </div>
                <p>Enter this code on the login page to continue.</p>
            </div>

            <!-- Security Notice -->
            <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px;">
                <p style="color: #64748b; font-size: 14px; margin: 0;">
                    For security reasons, this code will expire in 5 minutes. If you didn't request this code, please ignore this email.
                </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
                <p style="color: #71717a; font-size: 14px; margin: 5px 0;">
                    © 2024 Luxmed. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>`;

    console.log('Making request to Resend API...');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Luxmed <onboarding@resend.dev>',
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