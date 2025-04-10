
import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { X } from "lucide-react";

export const AuthDebugger = () => {
  const { user, profile, isAuthenticated, userRole, isLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    // Only show in non-production environments
    const isDev = window.location.hostname.includes('localhost') || 
                  window.location.hostname.includes('lovableproject');
    if (isDev) {
      setIsVisible(true);
    }
  }, []);

  const fetchDebugInfo = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
      setDebugInfo({
        userObject: user,
        profileFromRecoil: profile,
        profileFromDb: data,
        error: error,
        fetchTime: new Date().toISOString()
      });
    } catch (e) {
      setDebugInfo({ error: e });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm">
      <div className="flex justify-between mb-2">
        <h3 className="text-sm font-bold">Auth Debugger</h3>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsVisible(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-xs space-y-1 mb-3">
        <p><span className="font-semibold">Auth:</span> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><span className="font-semibold">Role:</span> {userRole || 'Unknown'}</p>
        <p><span className="font-semibold">User ID:</span> {user?.id || 'None'}</p>
        <p><span className="font-semibold">Profile Role:</span> {profile?.role || 'None'}</p>
        <p><span className="font-semibold">Loading:</span> {isLoading ? 'Yes' : 'No'}</p>
      </div>
      <div className="flex space-x-2">
        <Button onClick={fetchDebugInfo} size="sm" variant="outline" className="text-xs">
          Fetch Details
        </Button>
        <Button onClick={() => window.location.href = '/dashboard?view=pharmacy&section=dashboard'} size="sm" className="text-xs">
          Go to Pharmacy
        </Button>
      </div>
      
      {debugInfo && (
        <div className="mt-4 text-xs border-t pt-2">
          <p className="font-semibold">Debug Info:</p>
          <div className="mt-1 max-h-32 overflow-auto">
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthDebugger;
