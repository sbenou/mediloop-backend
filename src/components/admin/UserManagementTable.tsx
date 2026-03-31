import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ban, Trash2, UserCheck } from "lucide-react";
import { UserProfile } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  postAdminProfileSoftDelete,
  postAdminProfileToggleBlock,
} from "@/services/adminApi";

interface UserManagementTableProps {
  users?: UserProfile[];
  isLoading: boolean;
  updateUserRole: (userId: string, newRole: UserProfile['role']) => Promise<void>;
}

export const UserManagementTable = ({ users, isLoading, updateUserRole }: UserManagementTableProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const list = users ?? [];

  const handleRoleChange = async (userId: string, newRole: UserProfile['role']) => {
    try {
      await updateUserRole(userId, newRole);
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user role. Please try again.",
      });
    }
  };

  const handleSoftDelete = async (userId: string) => {
    setProcessingIds(prev => new Set(prev).add(userId));
    try {
      await postAdminProfileSoftDelete(userId);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({
        title: "User Deleted",
        description: "User has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error soft deleting user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user. Please try again.",
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleToggleBlock = async (userId: string) => {
    setProcessingIds(prev => new Set(prev).add(userId));
    try {
      await postAdminProfileToggleBlock(userId);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({
        title: "User Status Updated",
        description: "User block status has been successfully updated.",
      });
    } catch (error) {
      console.error('Error toggling user block status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user status. Please try again.",
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
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
                <TableHead>Role</TableHead>
                <TableHead>Change role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((user) => (
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
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="pharmacist">Pharmacist</SelectItem>
                        <SelectItem value="superadmin">Superadmin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleBlock(user.id)}
                      disabled={processingIds.has(user.id)}
                    >
                      {user.is_blocked ? (
                        <UserCheck className="mr-2 h-4 w-4" />
                      ) : (
                        <Ban className="mr-2 h-4 w-4" />
                      )}
                      {user.is_blocked ? 'Unblock' : 'Block'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleSoftDelete(user.id)}
                      disabled={processingIds.has(user.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
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
