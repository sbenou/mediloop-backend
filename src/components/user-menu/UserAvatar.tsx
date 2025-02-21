
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const UserAvatar = () => {
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      console.log('Fetching user profile in UserAvatar');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
        
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  return (
    <Avatar className="cursor-pointer">
      {userProfile?.avatar_url ? (
        <AvatarImage src={userProfile.avatar_url} alt="Profile" />
      ) : null}
      <AvatarFallback className="bg-[#7E69AB]/10">
        <User className="h-5 w-5 text-[#7E69AB]" />
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
