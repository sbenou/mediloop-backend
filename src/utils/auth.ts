import { supabase } from "@/lib/supabase";

export const sendPasswordResetEmail = async (email: string) => {
  console.log("Sending password reset email...");
  const redirectTo = `${window.location.origin}/reset-password`;
  console.log("Reset password redirect URL:", redirectTo);
  
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
    options: {
      emailTemplate: {
        subject: "Reset Your Password",
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
            <p style="color: #666; margin-bottom: 30px;">
              We received a request to reset your password. If you didn't make this request, you can safely ignore this email.
            </p>
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="{{link}}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              For security reasons, this link will expire in 24 hours.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
              If you're having trouble clicking the button, copy and paste this URL into your web browser: {{link}}
            </p>
          </div>
        `
      }
    }
  });
};