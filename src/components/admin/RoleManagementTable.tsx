import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const RoleManagementTable = () => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [tempRole, setTempRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [baseRoleId, setBaseRoleId] = useState<string>("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
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
    if (tempRole && tempRole.id === id) {
      await createRoleMutation.mutateAsync({
        name: editName,
        description: editDescription,
      });
      setTempRole(null);
    } else {
      await updateRoleMutation.mutateAsync({
        id,
        name: editName,
        description: editDescription,
      });
    }
    setIsEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (tempRole && tempRole.id === id) {
      setTempRole(null);
      setIsEditing(null);
    } else {
      setRoleToDelete(id);
    }
  };

  const confirmDelete = async () => {
    if (roleToDelete) {
      await deleteRoleMutation.mutateAsync(roleToDelete);
      setRoleToDelete(null);
    }
  };

  const handleAdd = () => {
    setShowCreateModal(true);
  };

  const handleCreateRole = async () => {
    try {
      // First create the new role
      const { data: newRole, error: createError } = await supabase
        .from('roles')
        .insert([
          {
            name: newRoleName,
            description: newRoleDescription,
          }
        ])
        .select()
        .single();

      if (createError) throw createError;

      // If a base role was selected, copy its permissions
      if (baseRoleId) {
        // Get the permissions of the base role
        const { data: basePermissions, error: permissionsError } = await supabase
          .from('role_permissions')
          .select('permission_id')
          .eq('role_id', baseRoleId);

        if (permissionsError) throw permissionsError;

        // Insert the permissions for the new role
        if (basePermissions.length > 0) {
          const newPermissions = basePermissions.map(({ permission_id }) => ({
            role_id: newRole.id,
            permission_id
          }));

          const { error: insertError } = await supabase
            .from('role_permissions')
            .insert(newPermissions);

          if (insertError) throw insertError;
        }
      }

      // Reset form and close modal
      setNewRoleName("");
      setNewRoleDescription("");
      setBaseRoleId("");
      setShowCreateModal(false);

      // Refetch roles to update the table
      queryClient.invalidateQueries({ queryKey: ['roles'] });

    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditing]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const allRoles = tempRole ? [...roles, tempRole] : roles;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Role Management</CardTitle>
          <Button 
            onClick={handleAdd} 
            size="sm"
            disabled={!!tempRole}
          >
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
              {allRoles.map((role) => (
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

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Enter role name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleDescription">Description</Label>
              <Textarea
                id="roleDescription"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                placeholder="Enter role description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseRole">Based on Role</Label>
              <Select value={baseRoleId} onValueChange={setBaseRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a base role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};