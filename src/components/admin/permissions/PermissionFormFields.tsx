import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { availableRoutePermissions } from "../types";

interface PermissionFormFieldsProps {
  route: string;
  permissionId: string;
  name: string;
  description: string;
  setRoute: (value: string) => void;
  setPermissionId: (value: string) => void;
  setName: (value: string) => void;
  setDescription: (value: string) => void;
}

export const PermissionFormFields = ({
  route,
  permissionId,
  name,
  description,
  setRoute,
  setPermissionId,
  setName,
  setDescription,
}: PermissionFormFieldsProps) => {
  const uniqueRoutes = Array.from(new Set(availableRoutePermissions.map(rp => rp.route)));

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="route">Route</Label>
        <Select value={route} onValueChange={setRoute} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a route" />
          </SelectTrigger>
          <SelectContent>
            {uniqueRoutes.map((route) => (
              <SelectItem key={route} value={route}>
                {route}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
    </div>
  );
};