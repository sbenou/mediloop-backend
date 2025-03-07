
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
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import UserAvatar from "@/components/user-menu/UserAvatar";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

const PharmacistSidebar = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentSection = searchParams.get("section") || "dashboard";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const navigateToPharmacySection = (section: string) => {
    setSearchParams({ view: 'pharmacy', section });
  };

  return (
    <div className="h-full w-64 bg-white border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Pharmacy Panel</h2>
      </div>
      
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-2">
          <button
            onClick={() => navigateToPharmacySection("dashboard")}
            className={`flex items-center px-2 py-2 text-sm rounded-md w-full ${
              currentSection === "dashboard" 
                ? "bg-primary text-white" 
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Dashboard
          </button>
          
          <button
            onClick={() => navigateToPharmacySection("patients")}
            className={`flex items-center px-2 py-2 text-sm rounded-md w-full ${
              currentSection === "patients" 
                ? "bg-primary text-white" 
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Users className="mr-3 h-5 w-5" />
            Patients
          </button>
          
          <button
            onClick={() => navigateToPharmacySection("orders")}
            className={`flex items-center px-2 py-2 text-sm rounded-md w-full ${
              currentSection === "orders" 
                ? "bg-primary text-white" 
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <ShoppingBag className="mr-3 h-5 w-5" />
            Orders
          </button>
          
          <button
            onClick={() => navigateToPharmacySection("prescriptions")}
            className={`flex items-center px-2 py-2 text-sm rounded-md w-full ${
              currentSection === "prescriptions" 
                ? "bg-primary text-white" 
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FileText className="mr-3 h-5 w-5" />
            Prescriptions
          </button>
        </nav>
      </div>
      
      <div className="p-4 border-t">
        <button
          onClick={() => navigateToPharmacySection("settings")}
          className={`flex items-center px-2 py-2 text-sm rounded-md w-full ${
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
          className="flex items-center px-2 py-2 mt-2 text-sm text-gray-700 rounded-md w-full hover:bg-gray-100"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
      
      <div className="p-4 border-t flex items-center">
        <div className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <UserAvatar 
            userProfile={profile} 
            canUpload={true} 
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && profile?.id) {
                // Handle file upload logic
                toast({
                  title: "Profile picture",
                  description: "Your profile picture is being updated",
                });
              }
            }}
          />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
          <p className="text-xs text-gray-500">{profile?.email || ""}</p>
        </div>
      </div>
    </div>
  );
};

export default PharmacistSidebar;
