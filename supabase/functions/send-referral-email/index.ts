
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.16";
import { Resend } from "npm:resend@2.0.0";

// Initialize Resend with API key
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { emails, referrer_name, referrer_id, referral_code } = await req.json();
    
    if (!Array.isArray(emails) || !emails.length) {
      throw new Error("No email addresses provided");
    }
    
    // Create the referral link - use a more flexible approach for the URL
    const requestUrl = new URL(req.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    const referralLink = `${baseUrl}/signup?referral=${referral_code}`;
    
    // Create a Supabase client using the supplied auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "https://hrrlefgnhkbzuwyklejj.supabase.co";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Create notification for the referrer
    await supabase
      .from('notifications')
      .insert({
        user_id: referrer_id,
        type: 'new_referral',
        title: 'Referral Sent',
        message: `You've referred ${emails.length} friends to MediLoop. You'll earn points when they join!`,
        meta: { emails_count: emails.length }
      });
    
    // Send emails to each recipient
    const results = await Promise.all(
      emails.map(async (email) => {
        try {
          // Check if referral already exists
          const { data: existingReferral } = await supabase
            .from('referrals')
            .select('id')
            .eq('referrer_id', referrer_id)
            .eq('referral_email', email)
            .maybeSingle();
            
          // If referral doesn't exist, create it
          if (!existingReferral) {
            await supabase.from('referrals').insert({
              referrer_id,
              referral_email: email,
              status: 'pending'
            });
          }
          
          // Send the email
          const { data, error } = await resend.emails.send({
            from: "MediLoop Referral <onboarding@resend.dev>",
            to: [email],
            subject: `${referrer_name} invited you to join MediLoop`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { text-align: center; padding: 20px 0; }
                  .content { padding: 20px; background: #f9f9f9; border-radius: 8px; }
                  .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; }
                  .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>You've been invited!</h1>
                  </div>
                  <div class="content">
                    <p>Hello there,</p>
                    <p>${referrer_name} thinks you'd love using MediLoop for your healthcare needs!</p>
                    <p>Join MediLoop today and you'll both receive loyalty points that can be used for discounts on future purchases.</p>
                    <div style="text-align: center;">
                      <a href="${referralLink}" class="button">Join MediLoop Now</a>
                    </div>
                    <p>This referral link is unique to you. Simply click the button above or copy the link below into your browser:</p>
                    <p style="word-break: break-all;">${referralLink}</p>
                  </div>
                  <div class="footer">
                    <p>MediLoop - Your Health, Our Priority</p>
                    <p>If you have any questions, please contact our support team.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });

          if (error) throw error;
          return { email, success: true };
        } catch (emailError) {
          console.error(`Failed to send email to ${email}:`, emailError);
          return { email, success: false, error: emailError };
        }
      })
    );
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} referral emails`,
        details: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in send-referral-email function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Failed to process referral emails"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
