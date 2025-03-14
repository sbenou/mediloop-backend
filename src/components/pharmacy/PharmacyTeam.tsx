
import React from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus } from 'lucide-react';
import { usePharmacyTeam } from './team/usePharmacyTeam';
import { TeamMemberDialog } from './team/TeamMemberDialog';
import { TeamMemberCard } from './team/TeamMemberCard';
import { EmptyTeamState } from './team/EmptyTeamState';

interface PharmacyTeamProps {
  pharmacyId: string;
  entityType?: 'doctor' | 'pharmacy';
}

const PharmacyTeam: React.FC<PharmacyTeamProps> = ({ pharmacyId, entityType = 'pharmacy' }) => {
  const {
    teamMembers,
    loading,
    addUserOpen,
    setAddUserOpen,
    handleToggleActive,
    handleAddMember,
    phoneValue,
    setPhoneValue,
    nokPhoneValue,
    setNokPhoneValue
  } = usePharmacyTeam(pharmacyId);

  return (
    <div className="space-y-6 container mx-auto px-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">{entityType === 'doctor' ? 'Doctor Team' : 'Pharmacy Team'}</h3>
        <Button onClick={() => setAddUserOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <p>Loading team members...</p>
        </div>
      ) : teamMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <div className="bg-muted p-3 rounded-full">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No Team Members Yet</h3>
          <p className="text-muted-foreground max-w-md">
            Add team members to your {entityType} to manage access and responsibilities.
          </p>
          {/* Button already exists in the header, don't duplicate it here */}
        </div>
      ) : (
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {teamMembers.map(member => (
              <TeamMemberCard 
                key={member.id}
                member={member}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        </div>
      )}

      <TeamMemberDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onSubmit={handleAddMember}
        phoneValue={phoneValue}
        setPhoneValue={setPhoneValue}
        nokPhoneValue={nokPhoneValue}
        setNokPhoneValue={setNokPhoneValue}
        entityType={entityType}
      />
    </div>
  );
};

export default PharmacyTeam;
