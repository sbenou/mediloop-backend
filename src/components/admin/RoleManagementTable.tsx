import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Role } from "@/types/role";
import { RoleTableRow } from "./RoleTableRow";
import { useRoleMutations } from "@/hooks/useRoleMutations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const RoleManagementTable = () => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const { createRoleMutation, updateRoleMutation, deleteRoleMutation } = useRoleMutations();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Role[];
    },
  });

  const handleEdit = (role: Role) => {
    setIsEditing(role.id);
    setEditName(role.name);
    setEditDescription(role.description);
  };

  const handleSave = async (id: string) => {
    await updateRoleMutation.mutateAsync({
      id,
      name: editName,
      description: editDescription,
    });
    setIsEditing(null);
  };

  const handleDelete = async (id: string) => {
    setRoleToDelete(id);
  };

  const confirmDelete = async () => {
    if (roleToDelete) {
      await deleteRoleMutation.mutateAsync(roleToDelete);
      setRoleToDelete(null);
    }
  };

  const handleAdd = async () => {
    const { data } = await createRoleMutation.mutateAsync({
      name: "name for the new role",
      description: "Description for new role",
    });
    
    if (data) {
      setIsEditing(data.id);
      setEditName(data.name);
      setEditDescription(data.description);
    }
  };

  useEffect(() => {
    // Focus on name input when editing starts
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditing]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Roles</CardTitle>
          <Button 
            onClick={handleAdd} 
            size="sm"
            disabled={createRoleMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            {createRoleMutation.isPending ? 'Adding...' : 'Add Role'}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <RoleTableRow
                  key={role.id}
                  role={role}
                  isEditing={isEditing === role.id}
                  editName={editName}
                  editDescription={editDescription}
                  onEdit={handleEdit}
                  onSave={handleSave}
                  onDelete={handleDelete}
                  setEditName={setEditName}
                  setEditDescription={setEditDescription}
                  ref={nameInputRef}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};