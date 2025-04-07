
import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCheck, UserMinus, Trash, Edit, Eye, MoreVertical } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { useRecoilValue } from 'recoil';
import { userAvatarState } from '@/store/user/atoms';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  role: string;
  pharmacy_id: string;
  status: 'active' | 'inactive';
  profile_image?: string | null;
}

interface TeamMemberCardProps {
  member: TeamMember;
  onToggleActive: (memberId: string, status: 'active' | 'inactive') => void;
  showMainDoctorBadge?: boolean;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ 
  member, 
  onToggleActive,
  showMainDoctorBadge = true
}) => {
  const isActive = member.status === 'active';
  // Get user avatar from Recoil state for the current user
  const globalUserAvatar = useRecoilValue(userAvatarState);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Determine which avatar URL to use
  // If this card represents the current user (by matching ID in the avatar URL), use the global avatar
  const displayAvatarUrl = globalUserAvatar && 
    globalUserAvatar.includes(`/${member.id}/`) ? 
    globalUserAvatar : member.profile_image;
  
  const handleStatusToggle = () => {
    // Pass the current status so the parent component can toggle it appropriately
    onToggleActive(member.id, member.status);
  };

  const handleViewMember = () => {
    toast({
      title: "View Member",
      description: `Viewing details for ${member.full_name}`
    });
  };

  const handleEditMember = () => {
    toast({
      title: "Edit Member",
      description: `Editing details for ${member.full_name}`
    });
  };

  const handleTerminateMember = () => {
    toast({
      title: "Terminate Member",
      description: `Are you sure you want to terminate ${member.full_name}?`,
      variant: "destructive"
    });
  };

  // Helper function to get formatted role display
  const getRoleDisplay = () => {
    const roleName = member.role.replace(/_/g, ' ');
    return roleName.charAt(0).toUpperCase() + roleName.slice(1);
  };

  // Determine role badge styling
  const getRoleBadgeStyles = () => {
    switch (member.role) {
      case 'doctor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pharmacist':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="w-full overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="p-0">
        <div className="bg-primary/5 h-24 flex items-center justify-center relative">
          {/* Moved 3-dot menu to top right corner */}
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewMember}>
                  <Eye className="h-4 w-4 mr-2" /> View Team Member
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEditMember}>
                  <Edit className="h-4 w-4 mr-2" /> Edit Team Member
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleTerminateMember}>
                  <Trash className="h-4 w-4 mr-2" /> Terminate Team Member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {member.role === 'doctor' && showMainDoctorBadge && (
            <Badge 
              variant="outline" 
              className="absolute top-2 left-2 bg-blue-100 text-blue-800 border-blue-200"
            >
              Main Doctor
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="flex flex-col items-center -mt-12">
          <Avatar className="h-24 w-24 border-4 border-white rounded-full">
            <AvatarImage src={displayAvatarUrl || undefined} alt={member.full_name} className="rounded-full" />
            <AvatarFallback className="text-lg rounded-full">{getInitials(member.full_name)}</AvatarFallback>
          </Avatar>
          
          <h3 className="font-medium text-lg mt-2">{member.full_name}</h3>
          
          {/* Replace Active/Inactive tag with role tag */}
          <Badge 
            variant="outline"
            className={`mt-1 ${getRoleBadgeStyles()}`}
          >
            {getRoleDisplay()}
          </Badge>
          
          <p className="text-sm text-muted-foreground mt-2">{member.email}</p>
          
          <div className="w-full mt-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Switch 
                checked={isActive} 
                onCheckedChange={handleStatusToggle}
                id={`status-${member.id}`}
              />
              <label 
                htmlFor={`status-${member.id}`}
                className="text-sm cursor-pointer"
              >
                {isActive ? 'Active' : 'Inactive'}
              </label>
            </div>
            
            <span className={`px-2 py-1 rounded-full text-xs ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
