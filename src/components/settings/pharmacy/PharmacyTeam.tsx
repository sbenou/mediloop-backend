
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { PharmacyTeamMember, PharmacyTeamMemberForm } from "./PharmacyTeamMemberForm";

interface PharmacyTeamProps {
  pharmacyId: string;
}

export const PharmacyTeam = ({ pharmacyId }: PharmacyTeamProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<PharmacyTeamMember | null>(null);
  const queryClient = useQueryClient();

  // Fetch team members
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['pharmacy-team', pharmacyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pharmacy_team_members')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as PharmacyTeamMember[];
    },
    enabled: !!pharmacyId
  });

  // Add team member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (member: Omit<PharmacyTeamMember, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('pharmacy_team_members')
        .insert([member])
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
    mutationFn: async (member: Partial<PharmacyTeamMember> & { id: string }) => {
      const { data, error } = await supabase
        .from('pharmacy_team_members')
        .update(member)
        .eq('id', member.id)
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

  const handleAddMember = (data: Omit<PharmacyTeamMember, 'id' | 'created_at' | 'updated_at'>) => {
    addMemberMutation.mutate(data);
  };

  const handleUpdateMember = (data: Partial<PharmacyTeamMember> & { id: string }) => {
    updateMemberMutation.mutate(data);
  };

  const handleDeleteMember = (memberId: string) => {
    if (window.confirm("Are you sure you want to remove this team member?")) {
      deleteMemberMutation.mutate(memberId);
    }
  };

  const handleEditMember = (member: PharmacyTeamMember) => {
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
                      <p className="text-sm">{member.phone_number}</p>
                      
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
                          onClick={() => handleDeleteMember(member.id as string)}
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
