import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

const UserAvatar = () => {
  return (
    <Avatar>
      <AvatarFallback className="bg-[#7E69AB]/10">
        <User className="h-5 w-5 text-[#7E69AB]" />
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;