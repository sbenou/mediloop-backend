
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { fetchPharmacyTeamApi } from "@/services/professionalWorkspaceApi";

export interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  role: string;
  is_active: boolean;
  phone_number?: string;
  pharmacy_id?: string;
  doctor_id?: string;
}

export const useProfessionalTeam = (
  entityId: string,
  entityType: "doctor" | "pharmacy",
) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);

        if (entityType === "pharmacy") {
          const rows = await fetchPharmacyTeamApi();
          const members: TeamMember[] = rows.map((row) => ({
            id: row.id,
            user_id: row.id,
            full_name: row.full_name || "Unknown",
            email: row.email || "No email",
            avatar_url: row.avatar_url,
            role: row.role || "pharmacy_user",
            is_active: !row.is_blocked,
            phone_number: undefined,
            pharmacy_id: entityId,
          }));
          setTeamMembers(members);
        } else {
          setTeamMembers([]);
        }
      } catch (error) {
        console.error(`Error fetching ${entityType} team members:`, error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load ${entityType} team members`,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, [entityId, entityType]);

  return {
    teamMembers,
    loading,
  };
};
