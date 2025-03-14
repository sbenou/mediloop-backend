
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Eye, Edit, UserX, MoreVertical, AlertTriangle } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

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
  onToggleActive: (memberId: string, currentStatus: 'active' | 'inactive') => void;
  isMainDoctor?: boolean;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ 
  member, 
  onToggleActive,
}) => {
  const isActive = member.status === 'active';
  
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'doctor': return 'Doctor';
      case 'pharmacist': return 'Pharmacist';
      case 'technician': return 'Pharmacy Technician';
      case 'intern': return 'Pharmacy Intern';
      case 'nurse': return 'Nurse';
      default: return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-500' : 'bg-red-500';
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.profile_image || undefined} />
              <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-md">{member.full_name}</h3>
              <p className="text-sm text-muted-foreground">{member.email}</p>
            </div>
          </div>
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Actions</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                <span>View Team Member</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit Team Member</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <UserX className="mr-2 h-4 w-4" />
                <span>Terminate Team Member</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="mt-2 space-y-2">
          <div className="flex justify-between items-center">
            <Badge variant="outline" className="font-normal">
              {getRoleLabel(member.role)}
            </Badge>
            <div className="flex items-center">
              <span className={`mr-2 h-2 w-2 rounded-full inline-block ${getStatusColor(member.status)}`}></span>
              <span className="text-xs text-muted-foreground">
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          
          {member.phone_number && (
            <p className="text-sm">
              <span className="font-medium">Phone:</span> {member.phone_number}
            </p>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 border-t flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Switch 
            checked={isActive} 
            onCheckedChange={(checked) => onToggleActive(member.id, checked ? 'active' : 'inactive')}
          />
          <span className="text-sm">
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        {!isActive && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p>This user is currently inactive</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardFooter>
    </Card>
  );
};
