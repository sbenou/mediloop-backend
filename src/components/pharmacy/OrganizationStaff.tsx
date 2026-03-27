import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRecoilValue } from "recoil";
import { userAvatarState } from "@/store/user/atoms";
import StaffMemberList from "./staff/StaffMemberList";
import StaffEmptyState from "./staff/StaffEmptyState";
import { StaffMember } from "./staff/types";
import { Button } from "@/components/ui/button";
import { UserPlus, LayoutList, LayoutGrid } from "lucide-react";
import { TeamMemberDialog } from "./team/TeamMemberDialog";
import { buildAuthHeaders } from "@/lib/activeContext";

interface OrganizationStaffProps {
  pharmacyId: string;
  entityType?: "doctor" | "pharmacy";
}

const OrganizationStaff: React.FC<OrganizationStaffProps> = ({
  pharmacyId,
  entityType = "pharmacy",
}) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [nokPhoneValue, setNokPhoneValue] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const { profile } = useAuth();
  const userAvatar = useRecoilValue(userAvatarState);

  useEffect(() => {
    fetchStaff();
  }, [pharmacyId]);

  const fetchStaff = async () => {
    try {
      setLoading(true);

      if (entityType === "doctor" && profile) {
        // For doctor view, just show the doctor (profile) as main staff
        setStaff([
          {
            id: profile.id || "",
            full_name: profile.full_name || "Doctor",
            email: profile.email || "",
            role: "doctor",
            status: "active",
            avatar_url: profile.avatar_url,
            user_id: profile.id,
          },
        ]);
      } else {
        // For pharmacy view, fetch staff from pharmacy team members
        const { data, error } = await supabase
          .from("pharmacy_team_members")
          .select(
            `
            id,
            profiles:user_id (
              id,
              full_name,
              email,
              role,
              avatar_url,
              is_blocked
            )
          `,
          )
          .eq("pharmacy_id", pharmacyId)
          .is("deleted_at", null);

        if (error) throw error;

        // Always include the current user/pharmacist if they aren't in the results
        const formattedStaff: StaffMember[] = [];

        // Add fetched team members
        if (data) {
          data.forEach((item: any) => {
            if (item.profiles) {
              formattedStaff.push({
                id: item.id,
                full_name: item.profiles.full_name || "Unknown",
                email: item.profiles.email || "",
                role: item.profiles.role || "staff",
                status: item.profiles.is_blocked ? "inactive" : "active",
                avatar_url: item.profiles.avatar_url,
                user_id: item.profiles.id,
              });
            }
          });
        }

        // Add the current user if they're not already in the list
        if (
          profile &&
          !formattedStaff.some((member) => member.email === profile.email)
        ) {
          formattedStaff.unshift({
            id: profile.id || "current-user",
            full_name: profile.full_name || "Current User",
            email: profile.email || "",
            role: profile.role || "pharmacist",
            status: "active",
            avatar_url: profile.avatar_url,
            user_id: profile.id,
          });
        }

        setStaff(formattedStaff);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);

      // Always include the current user in case of an error
      if (profile) {
        setStaff([
          {
            id: profile.id || "current-user",
            full_name: profile.full_name || "Current User",
            email: profile.email || "",
            role:
              profile.role ||
              (entityType === "doctor" ? "doctor" : "pharmacist"),
            status: "active",
            avatar_url: profile.avatar_url,
            user_id: profile.id,
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleStaffStatus = async (
    staffId: string,
    currentStatus: "active" | "inactive",
  ) => {
    try {
      // Determine new status
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const isActive = newStatus === "active";

      // Update in the database
      const { error } = await supabase
        .from("profiles")
        .update({ is_blocked: !isActive })
        .eq("id", staffId);

      if (error) throw error;

      // Update local state
      setStaff((prev) =>
        prev.map((member) =>
          member.user_id === staffId
            ? { ...member, status: newStatus }
            : member,
        ),
      );

      toast({
        title: "Status Updated",
        description: `Staff member ${newStatus === "active" ? "activated" : "deactivated"} successfully.`,
      });
    } catch (error) {
      console.error("Error toggling staff status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update staff status.",
      });
    }
  };

  const handleViewMember = (memberId: string) => {
    toast({
      title: "View Member",
      description: `Viewing details for team member ID: ${memberId}`,
    });
  };

  const handleEditMember = (memberId: string) => {
    toast({
      title: "Edit Member",
      description: `Editing team member ID: ${memberId}`,
    });
  };

  const handleTerminateMember = (memberId: string) => {
    toast({
      title: "Confirm Termination",
      description: `Are you sure you want to terminate this team member?`,
      variant: "destructive",
    });
  };

  // UPDATED: Use invitation system instead of direct user creation
  const handleAddMember = async (values: any) => {
    try {
      // Get the backend API URL from environment variable or use default
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

      // Get the current session token for authentication
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Not authenticated");
      }

      // Prepare invitation data
      const invitationData = {
        email: values.email,
        inviter_name: profile?.full_name || "Team Administrator",
        workplace_name: "Your Organization", // You may want to fetch this from your pharmacy/organization data
        invitation_type: values.role || "staff member",
        organization_id: pharmacyId,
        organization_type:
          entityType === "doctor" ? "doctor_practice" : "pharmacy",
        role: values.role,
        // Include additional profile data
        additional_data: {
          full_name: values.full_name,
          phone_number: values.phone_number,
          address_line1: values.address_line1,
          address_line2: values.address_line2,
          city: values.city,
          postal_code: values.postal_code,
          country: values.country,
          nok_full_name: values.nok_full_name,
          nok_relationship: values.nok_relationship,
          nok_phone_number: values.nok_phone_number,
          nok_address_line1: values.nok_address_line1,
          nok_address_line2: values.nok_address_line2,
          nok_city: values.nok_city,
          nok_postal_code: values.nok_postal_code,
          nok_country: values.nok_country,
        },
      };

      // Call your invitation API endpoint
      const response = await fetch(`${backendUrl}/api/invitations/send`, {
        method: "POST",
        headers: buildAuthHeaders({
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        }),
        body: JSON.stringify(invitationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send invitation");
      }

      const result = await response.json();

      toast({
        title: "Invitation Sent",
        description: `An invitation email has been sent to ${values.email}. They will be added to your team once they accept the invitation.`,
      });

      setDialogOpen(false);

      // Reset form values
      setPhoneValue("");
      setNokPhoneValue("");

      // Optionally refresh the staff list to show pending invitations
      // You might want to add a pending invitations section to your UI
      fetchStaff();
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send invitation",
      });
    }
  };

  const StaffCardView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {staff.map((member) => (
        <div
          key={member.id}
          className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.full_name}
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <span className="text-lg font-semibold">
                    {member.full_name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-medium">{member.full_name}</h3>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="text-sm">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${member.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {member.status}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewMember(member.user_id)}
              >
                View Profile
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-0">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <LayoutList className="h-4 w-4 mr-1" /> List
          </Button>
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("card")}
          >
            <LayoutGrid className="h-4 w-4 mr-1" /> Cards
          </Button>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-6">Loading staff...</div>
      ) : staff.length === 0 ? (
        <StaffEmptyState onAddStaff={() => setDialogOpen(true)} />
      ) : (
        <Card className="mb-4">
          <CardContent className="p-4">
            <TooltipProvider>
              {viewMode === "list" ? (
                <StaffMemberList
                  staff={staff}
                  currentUserId={profile?.id}
                  userAvatar={userAvatar}
                  onViewMember={handleViewMember}
                  onEditMember={handleEditMember}
                  onTerminateMember={handleTerminateMember}
                  onToggleActive={toggleStaffStatus}
                />
              ) : (
                <StaffCardView />
              )}
            </TooltipProvider>
          </CardContent>
        </Card>
      )}

      <TeamMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleAddMember}
        phoneValue={phoneValue}
        setPhoneValue={setPhoneValue}
        nokPhoneValue={nokPhoneValue}
        setNokPhoneValue={setNokPhoneValue}
        entityType={entityType}
        showAllTabs={false}
      />
    </div>
  );
};

export default OrganizationStaff;
