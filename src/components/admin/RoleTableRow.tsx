import { Role } from "@/types/role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";

interface RoleTableRowProps {
  role: Role;
  isEditing: boolean;
  editName: string;
  editDescription: string;
  onEdit: (role: Role) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
  setEditName: (name: string) => void;
  setEditDescription: (description: string) => void;
}

export const RoleTableRow = ({
  role,
  isEditing,
  editName,
  editDescription,
  onEdit,
  onSave,
  onDelete,
  setEditName,
  setEditDescription,
}: RoleTableRowProps) => {
  return (
    <TableRow key={role.id}>
      <TableCell>
        {isEditing ? (
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
        {isEditing ? (
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
          {isEditing ? (
            <Button
              size="sm"
              onClick={() => onSave(role.id)}
            >
              Save
            </Button>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onEdit(role)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(role.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};