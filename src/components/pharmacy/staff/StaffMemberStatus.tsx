
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface StaffMemberStatusProps {
  status: 'active' | 'inactive';
  onToggle?: () => void;
}

const StaffMemberStatus: React.FC<StaffMemberStatusProps> = ({ status, onToggle }) => {
  if (!onToggle) {
    // If no toggle handler is provided, just show the badge
    return (
      <Badge variant={status === 'active' ? 'success' : 'destructive'}>
        {status === 'active' ? 'Active' : 'Inactive'}
      </Badge>
    );
  }
  
  // If toggle handler is provided, show both the badge and switch
  return (
    <div className="flex items-center space-x-2">
      <Badge variant={status === 'active' ? 'success' : 'destructive'}>
        {status === 'active' ? 'Active' : 'Inactive'}
      </Badge>
      <Switch 
        checked={status === 'active'} 
        onCheckedChange={onToggle}
        className="ml-2"
      />
    </div>
  );
};

export default StaffMemberStatus;
