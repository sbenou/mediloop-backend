
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

/**
 * Handles role-based redirects consistently across the application
 */
export const handleRoleBasedRedirect = async (userId: string) => {
  console.log('Processing role-based redirect for user:', userId);
  
  try {
    // Fetch user's profile to determine role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile for redirect:', profileError);
      return false;
    }
    
    // Store login event in localStorage for cross-tab sync
    try {
      localStorage.setItem('last_auth_event', JSON.stringify({
        type: 'LOGIN',
        timestamp: new Date().toISOString(),
        role: profile.role,
        userId: userId
      }));
    } catch (e) {
      console.error('Error storing auth event:', e);
    }
    
    // Perform role-based redirect
    if (profile?.role === 'superadmin') {
      window.location.href = '/superadmin/dashboard';
      return true;
    } else if (profile?.role === 'pharmacist') {
      // Use window.location.href for a hard redirect to ensure complete page refresh
      window.location.href = '/pharmacy';
      return true;
    } else if (profile?.role === 'doctor') {
      // Use window.location.href for a hard redirect to ensure complete page refresh
      window.location.href = '/doctor';
      return true;
    } else {
      // Regular patients go to the universal dashboard, which was working before
      window.location.href = '/dashboard';
      return true;
    }
  } catch (err) {
    console.error('Error during role-based redirect:', err);
    return false;
  }
};

/**
 * Check if the user is on the correct dashboard based on their role
 * If not, redirect them to the appropriate dashboard
 */
export const ensureCorrectDashboard = async (currentRole: string | null, isAuthenticated: boolean) => {
  if (!isAuthenticated || !currentRole) return false;
  
  const currentPath = window.location.pathname;
  console.log('Ensuring correct dashboard for role:', currentRole, 'current path:', currentPath);
  
  // Check if user is on the correct dashboard based on role
  if (currentRole === 'pharmacist' && !currentPath.startsWith('/pharmacy')) {
    console.log('Pharmacist on wrong dashboard, redirecting to pharmacy dashboard');
    window.location.href = '/pharmacy';
    return true;
  } else if (currentRole === 'doctor' && !currentPath.startsWith('/doctor')) {
    console.log('Doctor on wrong dashboard, redirecting to doctor dashboard');
    window.location.href = '/doctor';
    return true;
  } else if (currentRole === 'superadmin' && !currentPath.startsWith('/superadmin')) {
    console.log('Superadmin on wrong dashboard, redirecting to superadmin dashboard');
    window.location.href = '/superadmin/dashboard';
    return true;
  }
  
  return false;
};

/**
 * Check if the user is authorized to access a specific dashboard
 * If not, redirect them to the appropriate dashboard
 */
export const checkDashboardAccess = (
  isAuthenticated: boolean, 
  userRole: string | null, 
  requiredRole: string,
  navigate: (path: string) => void
) => {
  console.log('Checking dashboard access:', { isAuthenticated, userRole, requiredRole });
  
  if (!isAuthenticated) {
    console.log('Not authenticated, should redirect to login');
    toast({
      variant: "destructive",
      title: "Authentication required",
      description: `Please login to access the ${requiredRole} dashboard.`,
    });
    navigate("/login");
    return false;
  }
  
  if (userRole !== requiredRole) {
    console.log(`Not a ${requiredRole}, should redirect to dashboard`);
    toast({
      title: "Access restricted",
      description: `Only ${requiredRole}s can access this dashboard.`,
    });
    navigate("/dashboard");
    return false;
  }
  
  return true;
};

/**
 * Get the correct dashboard path based on role - used in Login component
 */
export const getDashboardPath = (role: string): string => {
  switch (role) {
    case 'pharmacist':
      return '/pharmacy';
    case 'doctor':
      return '/doctor';
    case 'superadmin':
      return '/superadmin/dashboard';
    default:
      return '/dashboard'; // Default path for patients
  }
};
