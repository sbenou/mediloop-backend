
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { PharmacyTeamMember, PharmacyTeamMemberWithProfile } from "@/types/supabase";
import { PharmacyTeamMemberForm, PharmacyTeamMemberFormValues } from "./PharmacyTeamMemberForm";

interface PharmacyTeamProps {
  pharmacyId: string;
}

export const PharmacyTeam = ({ pharmacyId }: PharmacyTeamProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<PharmacyTeamMemberWithProfile | null>(null);
  const queryClient = useQueryClient();

  // Fetch team members
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['pharmacy-team', pharmacyId],
    queryFn: async () => {
      const { data: pharmacyTeam, error: teamError } = await supabase
        .from('pharmacy_team_members')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .order('created_at', { ascending: false });
        
      if (teamError) throw teamError;
      
      if (!pharmacyTeam || pharmacyTeam.length === 0) {
        return [] as PharmacyTeamMemberWithProfile[];
      }
      
      const userIds = pharmacyTeam.map(member => member.user_id).filter(Boolean);
      
      if (userIds.length === 0) {
        // Return the team members without profile data
        return pharmacyTeam.map(member => ({
          ...member,
          full_name: "Unknown",
          email: "No email",
          is_active: true
        })) as PharmacyTeamMemberWithProfile[];
      }
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, is_blocked')
        .in('id', userIds);
        
      if (profilesError) throw profilesError;
      
      // Combine pharmacy team data with profiles
      return pharmacyTeam.map(teamMember => {
        const profile = profiles?.find(p => p.id === teamMember.user_id);
        return {
          ...teamMember,
          full_name: profile?.full_name || 'Unknown',
          email: profile?.email || 'No email',
          avatar_url: profile?.avatar_url,
          is_active: profile ? !profile.is_blocked : true
        };
      }) as PharmacyTeamMemberWithProfile[];
    },
    enabled: !!pharmacyId
  });

  // Add team member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (values: PharmacyTeamMemberFormValues) => {
      // First, create or get user
      let userId: string | undefined = values.user_id;
      
      if (!userId) {
        // Check if user already exists
        const { data: existingUsers, error: userCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', values.email)
          .single();
          
        if (userCheckError && userCheckError.code !== 'PGRST116') {
          throw userCheckError;
        }
        
        if (existingUsers) {
          userId = existingUsers.id;
        } else {
          // Create new user in auth (this is simplified, normally would use Auth API)
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: values.email,
            password: Math.random().toString(36).slice(-8), // Random password
            options: {
              data: {
                full_name: values.full_name,
              }
            }
          });
          
          if (authError) throw authError;
          userId = authData.user?.id;
          
          if (!userId) throw new Error("Failed to create user");
        }
      }
      
      // Then add team member
      const { data, error } = await supabase
        .from('pharmacy_team_members')
        .insert([{
          user_id: userId,
          pharmacy_id: values.pharmacy_id,
          role: values.role,
        }])
        .select()
        .single();
        
      if (error) throw error;
      return data as PharmacyTeamMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-team', pharmacyId] });
      toast({
        title: "Team member added",
        description: "Team member has been added successfully.",
      });
      closeDialog();
    },
    onError: (error) => {
      console.error('Error adding team member:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add team member.",
      });
    }
  });

  // Update team member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async (values: PharmacyTeamMemberFormValues) => {
      if (!values.id) throw new Error("Missing team member ID");
      
      // Update profile info if needed
      if (values.user_id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: values.full_name,
            email: values.email,
          })
          .eq('id', values.user_id);
          
        if (profileError) throw profileError;
      }
      
      // Update team member role
      const { data, error } = await supabase
        .from('pharmacy_team_members')
        .update({
          role: values.role,
        })
        .eq('id', values.id)
        .select()
        .single();
        
      if (error) throw error;
      return data as PharmacyTeamMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-team', pharmacyId] });
      toast({
        title: "Team member updated",
        description: "Team member has been updated successfully.",
      });
      closeDialog();
    },
    onError: (error) => {
      console.error('Error updating team member:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update team member.",
      });
    }
  });

  // Delete team member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('pharmacy_team_members')
        .delete()
        .eq('id', memberId);
        
      if (error) throw error;
      return memberId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-team', pharmacyId] });
      toast({
        title: "Team member removed",
        description: "Team member has been removed successfully.",
      });
    },
    onError: (error) => {
      console.error('Error deleting team member:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove team member.",
      });
    }
  });

  const handleAddMember = (data: PharmacyTeamMemberFormValues) => {
    addMemberMutation.mutate(data);
  };

  const handleUpdateMember = (data: PharmacyTeamMemberFormValues) => {
    updateMemberMutation.mutate(data);
  };

  const handleDeleteMember = (memberId: string) => {
    if (window.confirm("Are you sure you want to remove this team member?")) {
      deleteMemberMutation.mutate(memberId);
    }
  };

  const handleEditMember = (member: PharmacyTeamMemberWithProfile) => {
    setEditingMember(member);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingMember(null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingMember(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const dialogTitle = editingMember ? "Edit Team Member" : "Add Team Member";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pharmacy Team</CardTitle>
          <Button onClick={openAddDialog}>
            Add Team Member
          </Button>
        </CardHeader>
        <CardContent>
          {teamMembers && teamMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member) => (
                <Card key={member.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col space-y-2">
                      <h3 className="font-medium text-lg">{member.full_name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                      <p className="text-sm">{member.email}</p>
                      
                      <div className="flex space-x-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditMember(member)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteMember(member.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 text-muted-foreground">
              <p>No team members added yet.</p>
              <p className="text-sm">Add team members to manage your pharmacy staff.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for adding/editing team members */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <PharmacyTeamMemberForm 
            initialData={editingMember || undefined} 
            onSubmit={editingMember ? handleUpdateMember : handleAddMember} 
            onCancel={closeDialog} 
            isEditing={!!editingMember}
            pharmacyId={pharmacyId}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
