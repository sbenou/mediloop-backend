import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Role } from "@/types/role";
import { RoleTableRow } from "./RoleTableRow";
import { useRoleMutations } from "@/hooks/useRoleMutations";

export const RoleManagementTable = () => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  
  const { createRoleMutation, updateRoleMutation, deleteRoleMutation } = useRoleMutations();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');
      
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
    await deleteRoleMutation.mutateAsync(id);
  };

  const handleAdd = async () => {
    await createRoleMutation.mutateAsync({
      name: "New Role",
      description: "Description for new role",
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
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
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};