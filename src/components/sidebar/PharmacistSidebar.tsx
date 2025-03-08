
import { useRef } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  Users,
  ShoppingBag,
  FileText,
  LayoutDashboard,
  Settings,
  LogOut,
  SquareUser,
  UserCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import UserAvatar from "@/components/user-menu/UserAvatar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { useSidebarNavigation } from "./hooks/useSidebarNavigation";
import { useNavigate, useSearchParams } from "react-router-dom";
import SidebarItem from "./SidebarItem";

const PharmacistSidebar = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentSection = searchParams.get("section") || "dashboard";
  const { navigateToLink, isPharmacistSectionActive } = useSidebarNavigation('pharmacist');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && profile?.id) {
      try {
        toast({
          title: "Uploading photo",
          description: "Your profile picture is being updated...",
        });

        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) return;

        const filePath = `${userId}/${crypto.randomUUID()}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', userId);

        toast({
          title: "Success",
          description: "Profile picture updated successfully",
        });

        // Force reload to show new avatar
        window.location.reload();
      } catch (error) {
        console.error('Error uploading avatar:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update profile picture",
        });
      }
    }
  };

  return (
    <div className="h-full w-64 bg-white border-r flex flex-col">
      <div className="p-4 border-b flex items-center">
        {/* Mediloop squared avatar at the top */}
        <Avatar className="h-10 w-10 rounded-md mr-3 bg-primary/10">
          <AvatarFallback className="rounded-md text-primary">
            <SquareUser className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-bold">Pharmacy Panel</h2>
      </div>
      
      <div className="flex-1 overflow-auto py-4 hover-scroll">
        <nav className="space-y-1 px-2">
          <SidebarItem
            icon={<LayoutDashboard className="mr-3 h-5 w-5" />}
            label="Dashboard"
            isActive={currentSection === "dashboard"}
            onClick={() => navigateToLink('/dashboard?view=pharmacy&section=dashboard')}
          />
          
          <SidebarItem
            icon={<Users className="mr-3 h-5 w-5" />}
            label="Patients"
            isActive={currentSection === "patients"}
            onClick={() => navigateToLink('/dashboard?view=pharmacy&section=patients')}
          />
          
          <SidebarItem
            icon={<ShoppingBag className="mr-3 h-5 w-5" />}
            label="Orders"
            isActive={currentSection === "orders"}
            onClick={() => navigateToLink('/dashboard?view=pharmacy&section=orders')}
          />
          
          <SidebarItem
            icon={<FileText className="mr-3 h-5 w-5" />}
            label="Prescriptions"
            isActive={currentSection === "prescriptions"}
            onClick={() => navigateToLink('/dashboard?view=pharmacy&section=prescriptions')}
          />
          
          <SidebarItem
            icon={<UserCircle className="mr-3 h-5 w-5" />}
            label="Profile"
            isActive={currentSection === "profile"}
            onClick={() => navigateToLink('/dashboard?view=pharmacy&section=profile')}
          />
        </nav>
      </div>
      
      <div className="p-4 border-t">
        <SidebarItem
          icon={<Settings className="mr-3 h-5 w-5" />}
          label="Settings"
          isActive={currentSection === "settings"}
          onClick={() => navigateToLink('/dashboard?view=pharmacy&section=settings')}
        />
        
        <SidebarItem
          icon={<LogOut className="mr-3 h-5 w-5" />}
          label="Logout"
          isActive={false}
          onClick={handleLogout}
        />
      </div>
      
      <div className="p-4 border-t flex items-center">
        <div onClick={handleAvatarClick} className="cursor-pointer">
          <UserAvatar 
            userProfile={profile} 
            canUpload={true} 
            onAvatarClick={handleAvatarClick}
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />
        </div>
        <div className="ml-3 cursor-pointer">
          <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
          <p className="text-xs text-gray-500">{profile?.email || ""}</p>
        </div>
      </div>
    </div>
  );
};

export default PharmacistSidebar;
