
import { UserProfile } from "@/types/user";

interface SidebarMenuProfileProps {
  profile: UserProfile | null;
  userRole: string;
  pharmacyName: string | null;
}

const SidebarMenuProfile = ({ profile, userRole, pharmacyName }: SidebarMenuProfileProps) => {
  // Determine display name based on user role - prioritize pharmacy_name for pharmacists
  const displayName = userRole === 'pharmacist' 
    ? pharmacyName || profile?.pharmacy_name || 'Pharmacy'
    : profile?.full_name || 'User';
  
  // Determine email or secondary text
  const secondaryText = userRole === 'pharmacist'
    ? 'Pharmacy Account'
    : profile?.email || 'user@example.com';

  return (
    <div className="flex-1">
      <p className="text-sm font-medium truncate">{displayName}</p>
      <p className="text-xs text-muted-foreground truncate">{secondaryText}</p>
    </div>
  );
};

export default SidebarMenuProfile;
