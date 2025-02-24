
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
  },

  // Manually refresh the session token
  refreshToken: async () => {
    debug("Manually refreshing session token");
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      debug("Token refresh failed:", error);
      throw error;
    }
    
    debug("Token refresh successful");
    return data;
  },

  // Revoke the current session
  revokeSession: async () => {
    debug("Revoking current session");
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    
    if (error) {
      debug("Session revocation failed:", error);
      throw error;
    }
    
    debug("Session successfully revoked");
  },

  // Revoke all sessions for the current user
  revokeAllSessions: async () => {
    debug("Revoking all sessions");
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    
    if (error) {
      debug("Global session revocation failed:", error);
      throw error;
    }
    
    debug("All sessions successfully revoked");
  },

  // Get current session data
  getSession: async () => {
    debug("Getting current session");
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      debug("Get session failed:", error);
      throw error;
    }
    
    debug("Session retrieved:", session?.user?.id);
    return session;
  }
};
