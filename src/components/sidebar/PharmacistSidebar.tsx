import { useNavigate, useSearchParams } from "react-router-dom";
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
          <button
            onClick={() => navigateToLink('/dashboard?view=pharmacy&section=dashboard')}
            className={`flex items-center px-2 py-2 text-sm rounded-md w-full text-left ${
              currentSection === "dashboard" 
                ? "bg-primary text-white" 
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Dashboard
          </button>
          
          <button
            onClick={() => navigateToLink('/dashboard?view=pharmacy&section=patients')}
            className={`flex items-center px-2 py-2 text-sm rounded-md w-full text-left ${
              currentSection === "patients" 
                ? "bg-primary text-white" 
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Users className="mr-3 h-5 w-5" />
            Patients
          </button>
          
          <button
            onClick={() => navigateToLink('/dashboard?view=pharmacy&section=orders')}
            className={`flex items-center px-2 py-2 text-sm rounded-md w-full text-left ${
              currentSection === "orders" 
                ? "bg-primary text-white" 
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <ShoppingBag className="mr-3 h-5 w-5" />
            Orders
          </button>
          
          <button
            onClick={() => navigateToLink('/dashboard?view=pharmacy&section=prescriptions')}
            className={`flex items-center px-2 py-2 text-sm rounded-md w-full text-left ${
              currentSection === "prescriptions" 
                ? "bg-primary text-white" 
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FileText className="mr-3 h-5 w-5" />
            Prescriptions
          </button>
          
          <button
            onClick={() => navigateToLink('/dashboard?view=pharmacy&section=profile')}
            className={`flex items-center px-2 py-2 text-sm rounded-md w-full text-left ${
              currentSection === "profile" 
                ? "bg-primary text-white" 
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <UserCircle className="mr-3 h-5 w-5" />
            Profile
          </button>
        </nav>
      </div>
      
      <div className="p-4 border-t">
        <button
          onClick={() => navigateToLink('/dashboard?view=pharmacy&section=settings')}
          className={`flex items-center px-2 py-2 text-sm rounded-md w-full text-left ${
            currentSection === "settings" 
              ? "bg-primary text-white" 
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Settings className="mr-3 h-5 w-5" />
          Settings
        </button>
        
        <button
          onClick={handleLogout}
          className="flex items-center px-2 py-2 mt-2 text-sm text-gray-700 rounded-md w-full hover:bg-gray-100 text-left"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
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
