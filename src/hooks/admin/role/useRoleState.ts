
import { useState } from "react";
import { Role } from "@/types/role";

export const useRoleState = () => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [tempRole, setTempRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [baseRoleId, setBaseRoleId] = useState<string>("");

  const handleCancelEdit = () => {
    setIsEditing(null);
    setEditName("");
    setEditDescription("");
  };

  return {
    isEditing,
    editName,
    editDescription,
    roleToDelete,
    tempRole,
    showCreateModal,
    newRoleName,
    newRoleDescription,
    baseRoleId,
    setIsEditing,
    setEditName,
    setEditDescription,
    setRoleToDelete,
    setTempRole,
    setShowCreateModal,
    setNewRoleName,
    setNewRoleDescription,
    setBaseRoleId,
    handleCancelEdit,
  };
};
