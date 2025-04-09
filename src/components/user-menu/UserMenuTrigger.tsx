
import { UserProfile } from "@/types/user";

interface UserMenuTriggerProps {
  profile: UserProfile | null;
  formattedRole: string;
}

const UserMenuTrigger = ({ profile, formattedRole }: UserMenuTriggerProps) => {
  return (
    <button 
      type="button"
      className="flex flex-col items-start hover:opacity-80 transition-opacity cursor-pointer outline-none text-sm"
      aria-label="User menu"
    >
      <span className="font-medium">{profile?.full_name || 'User'}</span>
      <span className="text-xs text-muted-foreground">{formattedRole}</span>
    </button>
  );
};

export default UserMenuTrigger;
