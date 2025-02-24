
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useRef, useEffect } from "react";
import { RoleTableRow } from "./RoleTableRow";
import { CreateRoleModal } from "./role/CreateRoleModal";
import { DeleteRoleDialog } from "./role/DeleteRoleDialog";
import { useRoleManagement } from "@/hooks/admin/useRoleManagement";

export const RoleManagementTable = () => {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const {
    roles,
    isLoading,
    isEditing,
    editName,
    editDescription,
    roleToDelete,
    tempRole,
    showCreateModal,
    newRoleName,
    newRoleDescription,
    baseRoleId,
    setEditName,
    setEditDescription,
    setShowCreateModal,
    setNewRoleName,
    setNewRoleDescription,
    setBaseRoleId,
    setRoleToDelete,
    handleEdit,
    handleSave,
    handleDelete,
    confirmDelete,
    handleCreateRole,
    handleCancelEdit,
  } = useRoleManagement();

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
            onClick={() => setShowCreateModal(true)} 
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
                  onCancel={handleCancelEdit}
                  setEditName={setEditName}
                  setEditDescription={setEditDescription}
                  ref={nameInputRef}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateRoleModal
        showModal={showCreateModal}
        roles={roles}
        newRoleName={newRoleName}
        newRoleDescription={newRoleDescription}
        baseRoleId={baseRoleId}
        onClose={() => setShowCreateModal(false)}
        onCreateRole={handleCreateRole}
        onNameChange={setNewRoleName}
        onDescriptionChange={setNewRoleDescription}
        onBaseRoleChange={setBaseRoleId}
      />

      <DeleteRoleDialog
        isOpen={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={() => roleToDelete && confirmDelete(roleToDelete)}
      />
    </>
  );
};
