import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface Role {
  id: string;
  name: string;
  description: string;
}

export const RoleManagementTable = () => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const createRoleMutation = useMutation({
    mutationFn: async (newRole: Omit<Role, 'id'>) => {
      const { data, error } = await supabase
        .from('roles')
        .insert([newRole])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: "Role added",
        description: "A new role has been added successfully.",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, ...role }: Role) => {
      const { data, error } = await supabase
        .from('roles')
        .update(role)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: "Role updated",
        description: "The role has been successfully updated.",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: "Role deleted",
        description: "The role has been successfully deleted.",
        variant: "destructive",
      });
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
        <Button onClick={handleAdd} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Role
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
              <TableRow key={role.id}>
                <TableCell>
                  {isEditing === role.id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="max-w-[200px]"
                    />
                  ) : (
                    role.name
                  )}
                </TableCell>
                <TableCell>
                  {isEditing === role.id ? (
                    <Input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  ) : (
                    role.description
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {isEditing === role.id ? (
                      <Button
                        size="sm"
                        onClick={() => handleSave(role.id)}
                      >
                        Save
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(role)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(role.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};