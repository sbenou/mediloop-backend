
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone } from "lucide-react";
import { TeamMember } from "./types";
import UserAvatar from "@/components/user-menu/UserAvatar";

interface TeamMemberCardProps {
  member: TeamMember;
  showMainDoctorBadge?: boolean;
  hideControls?: boolean;
  onViewProfile?: (member: TeamMember) => void;
  onEdit?: (member: TeamMember) => void;
  onRemove?: (member: TeamMember) => void;
}

export const TeamMemberCard = ({
  member,
  showMainDoctorBadge = false,
  hideControls = false,
  onViewProfile,
  onEdit,
  onRemove
}: TeamMemberCardProps) => {
  // Add a way to get initials from full name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Use our custom UserAvatar component with status indicator
  return (
    <Card className="overflow-hidden border border-gray-200 shadow-sm">
      <CardHeader className="p-0">
        <div className="bg-gray-100 p-4 flex justify-center">
          <UserAvatar
            userProfile={{
              id: member.id,
              full_name: member.full_name,
              email: member.email,
              avatar_url: member.profile_image,
              role: member.role,
              role_id: null,
              date_of_birth: null,
              city: null,
              auth_method: null,
              is_blocked: member.status === 'inactive',
              doctor_stamp_url: null,
              doctor_signature_url: null,
              pharmacist_stamp_url: null,
              pharmacist_signature_url: null,
              cns_card_front: null,
              cns_card_back: null,
              cns_number: null,
              deleted_at: null,
              created_at: null,
              updated_at: null,
              license_number: null,
              phone_number: member.phone_number,
              address: null // Add address field with null value
            }}
            size="lg"
            fallbackText={getInitials(member.full_name)}
            showStatus={true}
            isAvailable={member.isAvailable ?? false} // Pass availability status
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="text-center mb-3">
          <h3 className="font-semibold text-lg">{member.full_name}</h3>
          <p className="text-sm text-gray-500 capitalize">{member.role}</p>
        </div>
        
        {showMainDoctorBadge && (
          <div className="flex justify-center mb-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Main Doctor
            </Badge>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Mail className="w-4 h-4 mr-2 text-gray-500" />
            <span className="text-gray-700 truncate">{member.email}</span>
          </div>
          
          {member.phone_number && (
            <div className="flex items-center text-sm">
              <Phone className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-gray-700">{member.phone_number}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      {!hideControls && (
        <CardFooter className="p-4 pt-0 flex justify-between gap-2">
          {/* You can include control buttons here if needed */}
        </CardFooter>
      )}
    </Card>
  );
};
