
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
    const { referrerId, referrerEmail, referrerName, points, referralName } = await req.json();
    
    if (!referrerId || !referrerEmail) {
      throw new Error("Missing required referrer information");
    }
    
    // Create a Supabase client using the supplied auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "https://hrrlefgnhkbzuwyklejj.supabase.co";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhycmxlZmduaGtienV3eWtsZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNTk4MDgsImV4cCI6MjA1MDgzNTgwOH0.U2ErpuuwTRYq6DryXR1VbFWGiTUcTnRReeS0oiSSP9U";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Create notification in the app
    await supabase
      .from('notifications')
      .insert({
        user_id: referrerId,
        type: 'new_subscription',
        title: 'Referral Converted!',
        message: `${referralName || 'Someone'} has joined MediLoop through your referral! You've earned ${points} points.`,
        meta: { points, referralName }
      });
    
    // Send the email with confetti effect
    const { data, error } = await resend.emails.send({
      from: "MediLoop Rewards <onboarding@resend.dev>",
      to: [referrerEmail],
      subject: `🎉 Your referral was successful! You earned ${points} points!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; text-align: center; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { padding: 20px 0; }
            .content { padding: 20px; background: #f9f9f9; border-radius: 8px; }
            .points { font-size: 48px; font-weight: bold; color: #4f46e5; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; }
            .footer { margin-top: 40px; font-size: 12px; color: #666; }
            
            /* Confetti animation */
            #confetti-canvas {
              position: fixed;
              z-index: 1000;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              pointer-events: none;
            }
          </style>
          <script>
            window.onload = function() {
              startConfetti();
            };
            
            // Simple confetti effect
            function startConfetti() {
              const canvas = document.getElementById('confetti-canvas');
              const ctx = canvas.getContext('2d');
              const W = window.innerWidth;
              const H = window.innerHeight;
              canvas.width = W;
              canvas.height = H;
              
              // Confetti particles
              const particles = [];
              const particle_count = 150;
              
              // Colors for confetti
              const colors = ['#f44336', '#2196f3', '#ffeb3b', '#4caf50', '#9c27b0', '#ff9800'];
              
              for(let i = 0; i < particle_count; i++) {
                particles.push({
                  x: Math.random() * W,
                  y: Math.random() * H - H,
                  r: Math.random() * 10 + 5,
                  d: Math.random() * particle_count,
                  color: colors[Math.floor(Math.random() * colors.length)],
                  tilt: Math.floor(Math.random() * 10) - 10,
                  tiltAngle: Math.random() * 0.2 + 0.1,
                  tiltAngleIncrement: Math.random() * 0.07 + 0.05
                });
              }
              
              function draw() {
                ctx.clearRect(0, 0, W, H);
                
                particles.forEach(function(p) {
                  ctx.beginPath();
                  ctx.fillStyle = p.color;
                  ctx.moveTo(p.x, p.y);
                  ctx.fillRect(p.x, p.y, p.r, p.r * 2);
                  ctx.fill();
                  
                  p.y += 10;
                  p.tilt = Math.sin(p.tiltAngle) * 15;
                  p.tiltAngle += p.tiltAngleIncrement;
                  
                  // If particle is past the bottom of screen
                  if (p.y > H) {
                    // Send it to the top
                    p.y = -20;
                    p.x = Math.random() * W;
                  }
                });
                
                requestAnimationFrame(draw);
              }
              
              draw();
            }
          </script>
        </head>
        <body>
          <canvas id="confetti-canvas"></canvas>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations, ${referrerName || 'valued member'}! 🎉</h1>
            </div>
            <div class="content">
              <p>Great news! ${referralName || 'Someone'} has joined MediLoop through your referral!</p>
              <p>You've earned:</p>
              <div class="points">+${points} POINTS</div>
              <p>These points have been added to your loyalty account and can be used for discounts on future purchases.</p>
              <div style="text-align: center;">
                <a href="https://mediloop.app/loyalty" class="button">View Your Rewards</a>
              </div>
              <p>Thank you for sharing MediLoop with your friends and family!</p>
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

    if (error) {
      throw error;
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Referral success email sent",
        emailId: data?.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in send-referral-success-email function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Failed to send referral success email"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
