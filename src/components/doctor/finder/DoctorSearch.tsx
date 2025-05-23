
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, MapPin } from "lucide-react";

interface DoctorSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  useLocationFilter: boolean;
  setUseLocationFilter: (use: boolean) => void;
  userLocation: { lat: number; lon: number } | null;
}

export const DoctorSearch = ({
  searchQuery,
  setSearchQuery,
  useLocationFilter,
  setUseLocationFilter,
  userLocation
}: DoctorSearchProps) => {
  return (
    <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center mb-4 p-4 bg-white rounded-lg shadow-sm">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or specialty..."
          className="pl-10 pr-4 py-2 w-full"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="use-location"
          checked={useLocationFilter}
          onCheckedChange={setUseLocationFilter}
          disabled={!userLocation}
        />
        <Label 
          htmlFor="use-location" 
          className="flex items-center cursor-pointer"
        >
          <MapPin className="h-4 w-4 mr-1" />
          <span>{useLocationFilter ? 'Using your location' : 'Use my location'}</span>
        </Label>
      </div>
    </div>
  );
};
