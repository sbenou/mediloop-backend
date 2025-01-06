import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserProfile } from "@/types/user";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface UserManagementTableProps {
  users?: UserProfile[];
  isLoading: boolean;
  updateUserRole: (userId: string, newRole: UserProfile['role']) => Promise<void>;
}

export const UserManagementTable = ({ users, isLoading, updateUserRole }: UserManagementTableProps) => {
  const { toast } = useToast();

  const handleRoleChange = async (userId: string, newRole: UserProfile['role']) => {
    try {
      // First, get the permissions for the new role
      const { data: rolePermissions, error: roleError } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', newRole);

      if (roleError) throw roleError;

      // Start a transaction to update both the user's role and permissions
      const { error: updateError } = await supabase.rpc('update_user_role_and_permissions', {
        p_user_id: userId,
        p_new_role: newRole,
        p_new_permissions: rolePermissions.map(rp => rp.permission_id)
      });

      if (updateError) throw updateError;

      // Call the original updateUserRole function to update the UI
      await updateUserRole(userId, newRole);

      toast({
        title: "Role Updated",
        description: "User role and permissions have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating user role and permissions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user role and permissions. Please try again.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(newRole) => {
                        handleRoleChange(user.id, newRole as UserProfile['role']);
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="pharmacist">Pharmacist</SelectItem>
                        <SelectItem value="superadmin">Superadmin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};