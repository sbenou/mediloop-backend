
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { NextOfKin, RelationType } from "./types";
import { NextOfKinForm } from "./nextofkin/NextOfKinForm";
import { NextOfKinList } from "./nextofkin/NextOfKinList";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const NextOfKinManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKin, setEditingKin] = useState<NextOfKin | null>(null);
  const queryClient = useQueryClient();

  // Fetch next of kin contacts
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['next-of-kin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      
      type NextOfKinRecord = {
        id: string;
        user_id: string;
        full_name: string;
        phone_number: string;
        relation: string;
        street: string;
        city: string;
        postal_code: string;
        country: string;
        created_at: string;
        updated_at: string;
      };
      
      const { data, error } = await supabase
        .from('next_of_kin')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Convert the raw database records to the expected NextOfKin type
      // by ensuring relation is typed as RelationType
      const typedData = (data || []).map(record => ({
        ...record,
        relation: record.relation as RelationType
      })) as NextOfKin[];
      
      return typedData;
    }
  });

  // Add next of kin mutation
  const addKinMutation = useMutation({
    mutationFn: async (kin: Omit<NextOfKin, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('next_of_kin')
        .insert([{ ...kin, user_id: user.id }])
        .select()
        .single();
        
      if (error) throw error;
      return {
        ...data,
        relation: data.relation as RelationType
      } as NextOfKin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['next-of-kin'] });
      toast({
        title: "Contact added",
        description: "Next of kin contact has been added successfully.",
      });
      closeDialog();
    },
    onError: (error) => {
      console.error('Error adding next of kin:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add next of kin contact.",
      });
    }
  });

  // Update next of kin mutation
  const updateKinMutation = useMutation({
    mutationFn: async (kin: Partial<NextOfKin> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('next_of_kin')
        .update({ ...kin })
        .eq('id', kin.id)
        .eq('user_id', user.id)
        .select()
        .single();
        
      if (error) throw error;
      return {
        ...data,
        relation: data.relation as RelationType
      } as NextOfKin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['next-of-kin'] });
      toast({
        title: "Contact updated",
        description: "Next of kin contact has been updated successfully.",
      });
      closeDialog();
    },
    onError: (error) => {
      console.error('Error updating next of kin:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update next of kin contact.",
      });
    }
  });

  // Delete next of kin mutation
  const deleteKinMutation = useMutation({
    mutationFn: async (kinId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('next_of_kin')
        .delete()
        .eq('id', kinId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      return kinId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['next-of-kin'] });
      toast({
        title: "Contact deleted",
        description: "Next of kin contact has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Error deleting next of kin:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete next of kin contact.",
      });
    }
  });

  const handleAddKin = (data: Omit<NextOfKin, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    addKinMutation.mutate(data);
  };

  const handleUpdateKin = (data: Partial<NextOfKin> & { id: string }) => {
    updateKinMutation.mutate(data);
  };

  const handleDeleteKin = (kinId: string) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      deleteKinMutation.mutate(kinId);
    }
  };

  const handleEditKin = (kin: NextOfKin) => {
    setEditingKin(kin);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingKin(null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingKin(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const dialogTitle = editingKin ? "Edit Next of Kin Contact" : "Add Next of Kin Contact";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Next of Kin Contacts</CardTitle>
          <Button onClick={openAddDialog}>
            Add Contact
          </Button>
        </CardHeader>
        <CardContent>
          {contacts && contacts.length > 0 ? (
            <NextOfKinList 
              contacts={contacts} 
              onEdit={handleEditKin} 
              onDelete={handleDeleteKin} 
            />
          ) : (
            <div className="text-center p-6 text-muted-foreground">
              <p>No next of kin contacts added yet.</p>
              <p className="text-sm">Add a contact to help in case of emergency.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for adding/editing next of kin */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <NextOfKinForm 
            initialData={editingKin || undefined} 
            onSubmit={editingKin ? handleUpdateKin : handleAddKin} 
            onCancel={closeDialog} 
            isEditing={!!editingKin}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NextOfKinManagement;
