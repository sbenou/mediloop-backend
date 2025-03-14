
import React from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus, Users } from 'lucide-react'; 
import { usePharmacyTeam } from './team/usePharmacyTeam';
import { TeamMemberDialog } from './team/TeamMemberDialog';
import { TeamMemberCard } from './team/TeamMemberCard';
import { EmptyTeamState } from './team/EmptyTeamState';
import { useAuth } from '@/hooks/auth/useAuth';

interface PharmacyTeamProps {
  pharmacyId: string;
  entityType?: 'doctor' | 'pharmacy';
}

const PharmacyTeam: React.FC<PharmacyTeamProps> = ({ pharmacyId, entityType = 'pharmacy' }) => {
  const { profile } = useAuth();
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
      ) : (
        <div className="w-full">
          {entityType === 'doctor' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {profile && (
                <TeamMemberCard 
                  key="doctor-profile"
                  member={{
                    id: profile.id,
                    full_name: profile.full_name || 'Doctor',
                    email: profile.email || '',
                    phone_number: '',
                    role: 'doctor',
                    pharmacy_id: pharmacyId,
                    status: 'active',
                    profile_image: profile.avatar_url,
                  }}
                  onToggleActive={() => {}}
                  isMainDoctor={true}
                />
              )}
              
              {teamMembers.length > 0 ? (
                teamMembers.map(member => (
                  <TeamMemberCard 
                    key={member.id}
                    member={member}
                    onToggleActive={handleToggleActive}
                  />
                ))
              ) : profile ? (
                <div className="col-span-full">
                  <EmptyTeamState entityType={entityType} />
                </div>
              ) : null}
            </div>
          )}

          {(entityType !== 'doctor' && teamMembers.length === 0) ? (
            <EmptyTeamState entityType={entityType} />
          ) : (entityType !== 'doctor') ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {teamMembers.map(member => (
                <TeamMemberCard 
                  key={member.id}
                  member={member}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>
          ) : null}
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
