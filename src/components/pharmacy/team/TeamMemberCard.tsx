
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Mail, MoreVertical, ExternalLink } from 'lucide-react';
import UserAvatar from '@/components/user-menu/UserAvatar';
import { TeamMember } from './types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeamMemberCardProps {
  member: TeamMember;
  onToggleActive: (userId: string, isActive: boolean) => Promise<void>;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  member,
  onToggleActive
}) => {
  return (
    <Card key={member.user_id} className="overflow-hidden">
      <CardContent className="p-0">
        <div className="bg-gray-100 pt-6 pb-4 px-4">
          <div className="relative flex justify-between items-start">
            <div className="flex flex-col items-center w-full pr-8">
              <UserAvatar 
                userProfile={{
                  id: member.user_id,
                  avatar_url: member.avatar_url,
                  full_name: member.full_name,
                  role: member.role,
                  role_id: null,
                  email: member.email,
                  date_of_birth: null,
                  city: null,
                  auth_method: null,
                  is_blocked: !member.is_active,
                  doctor_stamp_url: null,
                  doctor_signature_url: null,
                  cns_card_front: null,
                  cns_card_back: null,
                  cns_number: null,
                  deleted_at: null,
                  created_at: null,
                  updated_at: null,
                  license_number: null
                }}
                size="xl"
              />
              <h3 className="font-medium text-center mt-2 truncate w-full">{member.full_name}</h3>
              <p className="text-sm text-gray-500 truncate w-full text-center">
                {member.role === 'pharmacist' ? 'Pharmacist' : 'Staff Member'}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 absolute top-0 right-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a href={`/pharmacy/staff/${member.user_id}`} className="flex items-center cursor-pointer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Profile
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-center mb-4">
            <Mail className="h-4 w-4 text-gray-400 mr-2" />
            <p className="text-sm truncate">{member.email}</p>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {member.is_active ? 'Active' : 'Inactive'}
            </span>
            <Switch 
              checked={member.is_active} 
              onCheckedChange={() => onToggleActive(member.user_id, member.is_active)}
              className={member.is_active ? "bg-green-500" : "bg-gray-400"}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
