
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import StaffMemberStatus from './StaffMemberStatus';
import StaffMemberActions from './StaffMemberActions';
import { StaffMember } from './types';

interface StaffMemberListProps {
  staff: StaffMember[];
  currentUserId?: string;
  userAvatar?: string;
  onViewMember: (memberId: string) => void;
  onEditMember: (memberId: string) => void;
  onTerminateMember: (memberId: string) => void;
}

const StaffMemberList: React.FC<StaffMemberListProps> = ({ 
  staff, 
  currentUserId,
  userAvatar,
  onViewMember, 
  onEditMember, 
  onTerminateMember 
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {staff.map((member) => {
          // Check if this is the current user to use the correct avatar
          const avatarUrl = userAvatar && 
            currentUserId === member.id ? 
            userAvatar : member.avatar_url;
            
          return (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>{member.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{member.full_name}</span>
                    {currentUserId === member.id && (
                      <span className="text-xs text-muted-foreground">(You)</span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>
                <Badge variant="outline" className={
                  member.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                  member.role === 'pharmacist' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <StaffMemberStatus status={member.status} />
              </TableCell>
              <TableCell className="text-right">
                <StaffMemberActions 
                  memberId={member.id}
                  onView={onViewMember}
                  onEdit={onEditMember}
                  onTerminate={onTerminateMember}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default StaffMemberList;
