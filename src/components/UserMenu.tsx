import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "./user-menu/UserAvatar";
import { UserMenuItems } from "./user-menu/UserMenuItems";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, memo, useState, useEffect, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { getSessionFromStorage } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { useRecoilState } from "recoil";
import { userAvatarState } from "@/store/user/atoms";

const UserMenu = memo(() => {
  const { isAuthenticated, isLoading, profile, userRole, isPharmacist } = useAuth();
  const [localLoading, setLocalLoading] = useState(true);
  const [hasVisibleSession, setHasVisibleSession] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useRecoilState(userAvatarState);
  
  // Format role for display - capitalize first letter
  const formattedRole = userRole ? 
    userRole.charAt(0).toUpperCase() + userRole.slice(1) : 
    'User';
  
  // Set initial avatar URL from profile
  useEffect(() => {
    if (profile?.avatar_url && !avatarUrl) {
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile?.avatar_url, setAvatarUrl, avatarUrl]);
  
  useEffect(() => {
    const checkSession = async () => {
      console.log("UserMenu: Checking session");
      
      const storedSession = getSessionFromStorage();
      if (storedSession?.user) {
        console.log("UserMenu: Found valid session in storage:", storedSession.user.id);
        setHasVisibleSession(true);
        setLocalLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error checking session in UserMenu:", error);
          setHasVisibleSession(false);
        } else if (data.session) {
          console.log("UserMenu: Found session via API:", data.session.user.id);
          setHasVisibleSession(!!data.session);
          
          if (data.session && !storedSession) {
            console.log("Session found in API but not in storage, storing it");
            const STORAGE_KEY = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
            try {
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.session));
              window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data.session));
            } catch (storageError) {
              console.error("Error storing session:", storageError);
            }
          }
        } else {
          console.log("UserMenu: No session found via API");
          setHasVisibleSession(false);
        }
      } catch (error) {
        console.error("Error checking session in UserMenu:", error);
        setHasVisibleSession(false);
      } finally {
        setLocalLoading(false);
      }
    };
    
    checkSession();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("UserMenu: Page became visible, checking session");
        if (!hasVisibleSession) {
          setLocalLoading(true);
        }
        checkSession();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    const handleTokenUpdate = () => {
      console.log("UserMenu: Auth token update event received");
      checkSession();
    };
    
    window.addEventListener('supabase:auth:token:update', handleTokenUpdate);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.includes('auth-token') || e.key === 'last_auth_event')) {
        console.log("Auth storage changed, rechecking session");
        checkSession();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('supabase:auth:token:update', handleTokenUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [hasVisibleSession]);

  const handleNavigateToLogin = useCallback(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  const handleNavigateToSettings = useCallback(() => {
    navigate('/settings?tab=profile');
    setMenuOpen(false);
  }, [navigate]);

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && profile?.id) {
      try {
        toast({
          title: "Uploading photo",
          description: "Your profile picture is being updated...",
        });

        const userId = profile.id;
        if (!userId) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "User not found",
          });
          return;
        }

        // Check if avatars bucket exists, create if not
        const { error: bucketError } = await supabase.storage.getBucket('avatars');
        if (bucketError && bucketError.message.includes('not found')) {
          const { error: createBucketError } = await supabase.storage.createBucket('avatars', {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
          });
          
          if (createBucketError) {
            console.error('Error creating bucket:', createBucketError);
            throw new Error('Failed to create storage bucket');
          }
        }
        
        const filePath = `${userId}/${crypto.randomUUID()}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            upsert: true,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', userId);
          
        if (updateError) {
          console.error('Profile update error:', updateError);
          throw updateError;
        }

        // Update Recoil state
        setAvatarUrl(publicUrl);

        toast({
          title: "Success",
          description: "Profile picture updated successfully",
        });
      } catch (error: any) {
        console.error('Error uploading avatar:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to update profile picture",
        });
      }
    }
  };

  const shouldShowSkeleton = isLoading && localLoading && !hasVisibleSession;

  if (shouldShowSkeleton) {
    return (
      <div className="h-10 w-10 rounded-full">
        <Skeleton className="h-full w-full rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated && !isLoading && !localLoading && !hasVisibleSession) {
    return (
      <button
        onClick={handleNavigateToLogin}
        className="text-primary hover:text-primary/80 transition-colors"
      >
        Connection
      </button>
    );
  }

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <div className="flex items-center space-x-2">
        <UserAvatar 
          userProfile={profile ? {
            ...profile,
            avatar_url: avatarUrl || profile.avatar_url
          } : undefined} 
          canUpload={true} 
          onAvatarClick={handleAvatarClick}
        />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        <DropdownMenuTrigger asChild>
          <button 
            type="button"
            className="flex flex-col items-start hover:opacity-80 transition-opacity cursor-pointer outline-none text-sm"
            aria-label="User menu"
          >
            <span className="font-medium">{profile?.full_name || 'User'}</span>
            <span className="text-xs text-muted-foreground">{formattedRole}</span>
          </button>
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent 
        align="end" 
        sideOffset={5}
        className="z-[9999] w-56 bg-white border rounded-md shadow-lg animate-in fade-in-0 zoom-in-95"
      >
        <UserMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

UserMenu.displayName = 'UserMenu';

export default UserMenu;
