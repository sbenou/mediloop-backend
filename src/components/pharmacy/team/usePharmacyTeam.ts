
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { TeamMember, TeamMemberStatus } from "./types";
import { fetchPharmacyTeamApi } from "@/services/professionalWorkspaceApi";

export const usePharmacyTeam = (pharmacyId: string) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeamMembers = useCallback(async () => {
    if (!pharmacyId) {
      setTeamMembers([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const rows = await fetchPharmacyTeamApi();
      const members: TeamMember[] = rows.map((profile) => ({
        id: profile.id,
        full_name: profile.full_name || "Unknown",
        email: profile.email || "No email",
        phone_number: undefined,
        role: profile.role || "pharmacy_user",
        pharmacy_id: pharmacyId,
        doctor_id: undefined,
        status: !profile.is_blocked ? "active" : "inactive" as TeamMemberStatus,
        profile_image: profile.avatar_url ?? undefined,
        isAvailable: !profile.is_blocked,
      }));
      setTeamMembers(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load pharmacy team members",
      });
    } finally {
      setLoading(false);
    }
  }, [pharmacyId]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  return {
    teamMembers,
    loading,
    refetch: fetchTeamMembers,
  };
};
