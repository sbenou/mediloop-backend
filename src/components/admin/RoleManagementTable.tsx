import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Role {
  id: string;
  name: string;
  description: string;
}

const initialRoles: Role[] = [
  { id: '1', name: 'user', description: 'Regular user with basic access' },
  { id: '2', name: 'doctor', description: 'Medical professional with patient management access' },
  { id: '3', name: 'pharmacist', description: 'Pharmacy staff with medication management access' },
  { id: '4', name: 'superadmin', description: 'Full system access and management capabilities' },
];

export const RoleManagementTable = () => {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const { toast } = useToast();

  const handleEdit = (role: Role) => {
    setIsEditing(role.id);
    setEditName(role.name);
    setEditDescription(role.description);
  };

  const handleSave = (id: string) => {
    setRoles(roles.map(role => 
      role.id === id 
        ? { ...role, name: editName, description: editDescription }
        : role
    ));
    setIsEditing(null);
    toast({
      title: "Role updated",
      description: "The role has been successfully updated.",
    });
  };

  const handleDelete = (id: string) => {
    setRoles(roles.filter(role => role.id !== id));
    toast({
      title: "Role deleted",
      description: "The role has been successfully deleted.",
      variant: "destructive",
    });
  };

  const handleAdd = () => {
    const newRole: Role = {
      id: String(Date.now()),
      name: "New Role",
      description: "Description for new role",
    };
    setRoles([...roles, newRole]);
    handleEdit(newRole);
    toast({
      title: "Role added",
      description: "A new role has been added. Please edit its details.",
    });
  };

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