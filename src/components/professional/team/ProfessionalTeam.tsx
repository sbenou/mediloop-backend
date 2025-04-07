
import React from 'react';
import { useProfessionalTeam } from './useProfessionalTeam';
import { TeamMemberCard } from '@/components/pharmacy/team/TeamMemberCard';
import { EmptyTeamState } from '@/components/pharmacy/team/EmptyTeamState';
import { useAuth } from '@/hooks/auth/useAuth';
import { useRecoilValue } from 'recoil';
import { userAvatarState } from '@/store/user/atoms';

interface ProfessionalTeamProps {
  entityId: string;
  entityType: 'doctor' | 'pharmacy';
}

const ProfessionalTeam: React.FC<ProfessionalTeamProps> = ({ entityId, entityType }) => {
  const { profile } = useAuth();
  const userAvatar = useRecoilValue(userAvatarState);
  const { teamMembers, loading } = useProfessionalTeam(entityId, entityType);

  // Function to transform TeamMember from the hook to the format expected by TeamMemberCard
  const mapTeamMemberToCardMember = (member: any) => {
    // Check if this member is the current user to use the correct avatar
    const avatarUrl = userAvatar && 
      profile?.id === member.id ? 
      userAvatar : member.avatar_url;
      
    return {
      id: member.id,
      full_name: member.full_name,
      email: member.email,
      phone_number: member.phone_number || '',
      role: member.role,
      pharmacy_id: entityType === 'pharmacy' ? entityId : undefined,
      doctor_id: entityType === 'doctor' ? entityId : undefined,
      status: member.is_active ? 'active' : 'inactive' as 'active' | 'inactive',
      profile_image: avatarUrl,
    };
  };

  const entityLabel = entityType === 'doctor' ? 'Doctor Team' : 'Pharmacy Team';

  return (
    <div className="space-y-6 container mx-auto px-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">{entityLabel}</h3>
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
                    pharmacy_id: entityType === 'pharmacy' ? entityId : undefined,
                    doctor_id: entityType === 'doctor' ? entityId : undefined,
                    status: 'active',
                    profile_image: userAvatar || profile.avatar_url,
                  }}
                  showMainDoctorBadge={true}
                  hideControls={true}
                />
              )}
              
              {teamMembers.length > 0 ? (
                teamMembers.map(member => (
                  <TeamMemberCard 
                    key={member.id}
                    member={mapTeamMemberToCardMember(member)}
                    showMainDoctorBadge={false}
                    hideControls={true}
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
                  member={mapTeamMemberToCardMember(member)}
                  showMainDoctorBadge={false}
                  hideControls={true}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ProfessionalTeam;
