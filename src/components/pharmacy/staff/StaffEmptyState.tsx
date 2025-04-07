
import React from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus } from 'lucide-react';

interface StaffEmptyStateProps {
  onAddStaff: () => void;
}

const StaffEmptyState: React.FC<StaffEmptyStateProps> = ({ onAddStaff }) => {
  return (
    <div className="text-center py-6">
      <p className="text-muted-foreground mb-4">No staff members found.</p>
      <Button onClick={onAddStaff}>
        <UserPlus className="mr-2 h-4 w-4" />
        Add Staff Member
      </Button>
    </div>
  );
};

export default StaffEmptyState;
