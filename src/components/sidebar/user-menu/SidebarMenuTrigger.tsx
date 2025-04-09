
import { ChevronDown } from "lucide-react";
import SidebarMenuProfile from "./SidebarMenuProfile";
import { UserProfile } from "@/types/user";

interface SidebarMenuTriggerProps {
  profile: UserProfile | null;
  userRole: string;
  pharmacyName: string | null;
}

const SidebarMenuTrigger = ({ profile, userRole, pharmacyName }: SidebarMenuTriggerProps) => {
  return (
    <div className="overflow-hidden flex-1 flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-colors">
      <SidebarMenuProfile profile={profile} userRole={userRole} pharmacyName={pharmacyName} />
      <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
    </div>
  );
};

export default SidebarMenuTrigger;
