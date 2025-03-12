
import React from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus } from 'lucide-react';
import { usePharmacyTeam } from './team/usePharmacyTeam';
import { TeamMemberDialog } from './team/TeamMemberDialog';
import { TeamMemberCard } from './team/TeamMemberCard';
import { EmptyTeamState } from './team/EmptyTeamState';

interface PharmacyTeamProps {
  pharmacyId: string;
}

const PharmacyTeam: React.FC<PharmacyTeamProps> = ({ pharmacyId }) => {
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
      <div className="flex flex-col items-center justify-center space-y-4">
        <h3 className="text-xl font-semibold">Pharmacy Team</h3>
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
        <EmptyTeamState onAddMember={() => setAddUserOpen(true)} />
      ) : (
        <div className="flex justify-center w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-5xl">
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
      />
    </div>
  );
};

export default PharmacyTeam;
