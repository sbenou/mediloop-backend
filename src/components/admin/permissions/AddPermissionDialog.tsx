import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { PermissionFormFields } from "./PermissionFormFields";
import { NewPermission, addNewPermission } from "../types";
import { useToast } from "@/hooks/use-toast";

export const AddPermissionDialog = () => {
  const [open, setOpen] = useState(false);
  const [route, setRoute] = useState("");
  const [permissionId, setPermissionId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newPermission: NewPermission = {
      route,
      id: permissionId.toLowerCase().replace(/\s+/g, '_'),
      name,
      description
    };

    addNewPermission(newPermission);
    
    toast({
      title: "Permission Added",
      description: `Successfully added ${name} permission to ${route}`,
    });

    setOpen(false);
    setRoute("");
    setPermissionId("");
    setName("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Permission
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Permission</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PermissionFormFields
            route={route}
            permissionId={permissionId}
            name={name}
            description={description}
            setRoute={setRoute}
            setPermissionId={setPermissionId}
            setName={setName}
            setDescription={setDescription}
          />
          <Button type="submit" className="w-full">Add Permission</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};