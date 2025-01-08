import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

const UserAvatar = () => {
  return (
    <Avatar>
      <AvatarFallback className="bg-primary/10">
        <User className="h-5 w-5 text-primary" />
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;