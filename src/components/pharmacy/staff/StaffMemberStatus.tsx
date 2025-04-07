
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface StaffMemberStatusProps {
  status: 'active' | 'inactive';
}

const StaffMemberStatus: React.FC<StaffMemberStatusProps> = ({ status }) => {
  return (
    <Badge variant={status === 'active' ? 'success' : 'destructive'}>
      {status === 'active' ? 'Active' : 'Inactive'}
    </Badge>
  );
};

export default StaffMemberStatus;
