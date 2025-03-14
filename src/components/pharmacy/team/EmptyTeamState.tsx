
import React from 'react';
import { Users } from 'lucide-react';

interface EmptyTeamStateProps {
  entityType: 'doctor' | 'pharmacy';
}

export const EmptyTeamState: React.FC<EmptyTeamStateProps> = ({ entityType }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 border rounded-lg p-8">
      <div className="bg-muted p-3 rounded-full">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">No Team Members Yet</h3>
      <p className="text-muted-foreground max-w-md">
        Add team members to your {entityType} to manage access and responsibilities.
      </p>
    </div>
  );
};
