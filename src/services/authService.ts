
import { supabase } from "@/lib/supabase";
import { AuthError, Session, User } from "@supabase/supabase-js";

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  role: string;
  licenseNumber?: string;
}

class AuthService {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthService] Sign in error:', error);
        return { user: null, session: null, error };
      }

      console.log('[AuthService] Sign in successful:', data.user?.id);
      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('[AuthService] Unexpected sign in error:', error);
      return { 
        user: null, 
        session: null, 
        error: error as AuthError 
      };
    }
  }

  /**
   * Sign up with email, password and user metadata
   */
  async signUp(signUpData: SignUpData): Promise<AuthResponse> {
    try {
      const { email, password, fullName, role, licenseNumber } = signUpData;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            license_number: licenseNumber || null,
          },
        },
      });

      if (error) {
        console.error('[AuthService] Sign up error:', error);
        return { user: null, session: null, error };
      }

      console.log('[AuthService] Sign up successful:', data.user?.id);
      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('[AuthService] Unexpected sign up error:', error);
      return { 
        user: null, 
        session: null, 
        error: error as AuthError 
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthService] Sign out error:', error);
        return { error };
      }

      console.log('[AuthService] Sign out successful');
      return { error: null };
    } catch (error) {
      console.error('[AuthService] Unexpected sign out error:', error);
      return { error: error as AuthError };
    }
  }

  /**
   * Get the current session
   */
  async getCurrentSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[AuthService] Get session error:', error);
        return { session: null, error };
      }

      return { session: data.session, error: null };
    } catch (error) {
      console.error('[AuthService] Unexpected get session error:', error);
      return { session: null, error: error as AuthError };
    }
  }

  /**
   * Get the current user
   */
  async getCurrentUser(): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('[AuthService] Get user error:', error);
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('[AuthService] Unexpected get user error:', error);
      return { user: null, error: error as AuthError };
    }
  }

  /**
   * Request password reset
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        console.error('[AuthService] Reset password error:', error);
        return { error };
      }

      console.log('[AuthService] Reset password email sent');
      return { error: null };
    } catch (error) {
      console.error('[AuthService] Unexpected reset password error:', error);
      return { error: error as AuthError };
    }
  }

  /**
   * Update password with new password
   */
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        console.error('[AuthService] Update password error:', error);
        return { error };
      }

      console.log('[AuthService] Password updated successfully');
      return { error: null };
    } catch (error) {
      console.error('[AuthService] Unexpected update password error:', error);
      return { error: error as AuthError };
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[AuthService] Refresh session error:', error);
        return { session: null, error };
      }

      console.log('[AuthService] Session refreshed successfully');
      return { session: data.session, error: null };
    } catch (error) {
      console.error('[AuthService] Unexpected refresh session error:', error);
      return { session: null, error: error as AuthError };
    }
  }
}

// Export a singleton instance
export const authService = new AuthService();
export default authService;
