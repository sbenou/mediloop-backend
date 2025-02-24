
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface LocationToggleProps {
  showDefaultLocation: boolean;
  onLocationToggle: (checked: boolean) => void;
}

export const LocationToggle = ({
  showDefaultLocation,
  onLocationToggle
}: LocationToggleProps) => {
  return (
    <div className="flex items-center space-x-2 mb-4">
      <Switch
        id="location-mode"
        checked={showDefaultLocation}
        onCheckedChange={onLocationToggle}
      />
      <Label htmlFor="location-mode">Show my location</Label>
    </div>
  );
};
