import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { NewPermission, addNewPermission } from "./types";
import { useToast } from "@/hooks/use-toast";

export const AddPermissionForm = () => {
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
          <div>
            <Label htmlFor="route">Route</Label>
            <Input
              id="route"
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              placeholder="e.g., Products, Orders, etc."
              required
            />
          </div>
          <div>
            <Label htmlFor="permissionId">Permission ID</Label>
            <Input
              id="permissionId"
              value={permissionId}
              onChange={(e) => setPermissionId(e.target.value)}
              placeholder="e.g., create_product"
              required
            />
          </div>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Create"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Can create new products"
              required
            />
          </div>
          <Button type="submit" className="w-full">Add Permission</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};