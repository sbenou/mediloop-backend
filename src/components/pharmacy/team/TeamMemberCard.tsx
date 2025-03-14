
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, User, Shield } from 'lucide-react';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
  pharmacy_id: string;
  status: 'active' | 'inactive';
  profile_image?: string;
}

interface TeamMemberCardProps {
  member: TeamMember;
  onToggleActive: (memberId: string, currentStatus: 'active' | 'inactive') => void;
  isMainDoctor?: boolean;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ 
  member, 
  onToggleActive,
  isMainDoctor = false
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'doctor':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'pharmacist':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'technician':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'intern':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getHumanReadableRole = (role: string) => {
    switch (role) {
      case 'doctor':
        return 'Doctor';
      case 'pharmacist':
        return 'Pharmacist';
      case 'technician':
        return 'Pharmacy Technician';
      case 'intern':
        return 'Pharmacy Intern';
      default:
        return 'Staff Member';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 pt-4 relative">
        {isMainDoctor && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
              <Shield className="h-3 w-3 mr-1" /> Main Doctor
            </Badge>
          </div>
        )}
        <div className="flex justify-center">
          <Avatar className="h-20 w-20">
            <AvatarImage src={member.profile_image} alt={member.full_name} />
            <AvatarFallback className="text-lg">{getInitials(member.full_name)}</AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-center text-lg mt-2">{member.full_name}</CardTitle>
        <div className="flex justify-center mt-1">
          <Badge variant="outline" className={getRoleBadgeColor(member.role)}>
            {getHumanReadableRole(member.role)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Mail className="h-4 w-4 mr-2" />
            <span className="truncate">{member.email}</span>
          </div>
          {member.phone_number && (
            <div className="flex items-center text-muted-foreground">
              <Phone className="h-4 w-4 mr-2" />
              <span>{member.phone_number}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-1 pb-3">
        {!isMainDoctor && (
          <Button 
            variant={member.status === 'active' ? "outline" : "default"} 
            size="sm" 
            className="w-full"
            onClick={() => onToggleActive(member.id, member.status)}
          >
            {member.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
