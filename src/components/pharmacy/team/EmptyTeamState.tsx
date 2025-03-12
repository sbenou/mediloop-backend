
import React from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus, UserX } from 'lucide-react';

interface EmptyTeamStateProps {
  onAddMember: () => void;
}

export const EmptyTeamState: React.FC<EmptyTeamStateProps> = ({ onAddMember }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-6 text-center">
      <UserX className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">No team members</h3>
      <p className="mt-1 text-sm text-gray-500">Get started by adding a new team member.</p>
      <div className="mt-6">
        <Button onClick={onAddMember}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </div>
    </div>
  );
};
