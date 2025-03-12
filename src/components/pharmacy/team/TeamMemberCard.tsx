
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Mail } from 'lucide-react';
import UserAvatar from '@/components/user-menu/UserAvatar';
import { TeamMember } from './types';

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
        <div className="bg-gray-100 pt-6 pb-4 px-4 flex flex-col items-center">
          <div className="relative">
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
              size="xl" // Increasing the size to make the avatar larger
            />
          </div>
          <h3 className="font-medium text-center mt-2 truncate w-full">{member.full_name}</h3>
          <p className="text-sm text-gray-500 truncate w-full text-center">
            {member.role === 'pharmacist' ? 'Pharmacist' : 'Staff Member'}
          </p>
        </div>
        <div className="p-4">
          <div className="flex items-center">
            <Mail className="h-4 w-4 text-gray-400 mr-2" />
            <p className="text-sm truncate">{member.email}</p>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {member.is_active ? 'Active' : 'Inactive'}
              </span>
              <Switch 
                checked={member.is_active} 
                onCheckedChange={() => onToggleActive(member.user_id, member.is_active)}
                className={member.is_active ? "bg-green-500" : "bg-gray-400"}
              />
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href={`/pharmacy/staff/${member.user_id}`}>View Profile</a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
