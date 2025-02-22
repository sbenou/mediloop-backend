
import { supabase } from "@/lib/supabase";

const debug = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Auth Service] ${message}`, data || '');
  }
};

export const AuthService = {
  requestOtp: async (email: string): Promise<void> => {
    debug("Requesting OTP for:", email);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    
    if (error) {
      if (process.env.NODE_ENV === 'development' && 
         (error.message?.includes('rate limit') || error.code === 'over_email_send_rate_limit')) {
        debug("Rate limit bypassed in development mode");
        return;
      }
      throw error;
    }
    debug("OTP request successful");
  },

  verifyOtp: async (email: string, token: string): Promise<void> => {
    debug("Verifying OTP for:", { email, tokenLength: token.length });
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });
    
    if (error) {
      if (process.env.NODE_ENV === 'development' && 
         (error.message?.includes('rate limit') || error.code === 'over_email_send_rate_limit')) {
        debug("Rate limit bypassed in development mode");
        return;
      }
      throw error;
    }
    debug("OTP verification successful");
  }
};
