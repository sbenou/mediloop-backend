
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { NextOfKin, RelationType } from "./types";
import { NextOfKinForm } from "./nextofkin/NextOfKinForm";
import { NextOfKinList } from "./nextofkin/NextOfKinList";

const NextOfKinManagement = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingKin, setEditingKin] = useState<NextOfKin | null>(null);
  const queryClient = useQueryClient();

  // Fetch next of kin contacts
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['next-of-kin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      
      // Use any to bypass TypeScript errors until database types are updated
      const { data, error } = await supabase
        .from('next_of_kin' as any)
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      return data as unknown as NextOfKin[];
    }
  });

  // Add next of kin mutation
  const addKinMutation = useMutation({
    mutationFn: async (kin: Omit<NextOfKin, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('next_of_kin' as any)
        .insert([{ ...kin, user_id: user.id }])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['next-of-kin'] });
      toast({
        title: "Contact added",
        description: "Next of kin contact has been added successfully.",
      });
      setIsAdding(false);
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
        .from('next_of_kin' as any)
        .update({ ...kin })
        .eq('id', kin.id)
        .eq('user_id', user.id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['next-of-kin'] });
      toast({
        title: "Contact updated",
        description: "Next of kin contact has been updated successfully.",
      });
      setEditingKin(null);
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
        .from('next_of_kin' as any)
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
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingKin(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Next of Kin Contacts</CardTitle>
          {!isAdding && !editingKin && (
            <Button onClick={() => setIsAdding(true)}>
              Add Contact
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isAdding ? (
            <NextOfKinForm onSubmit={handleAddKin} onCancel={handleCancel} />
          ) : editingKin ? (
            <NextOfKinForm 
              initialData={editingKin} 
              onSubmit={handleUpdateKin} 
              onCancel={handleCancel} 
              isEditing 
            />
          ) : contacts && contacts.length > 0 ? (
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
    </div>
  );
};

export default NextOfKinManagement;
