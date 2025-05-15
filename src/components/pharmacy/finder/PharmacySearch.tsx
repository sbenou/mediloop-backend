
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Search, Locate } from "lucide-react";

interface PharmacySearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  useLocationFilter: boolean;
  setUseLocationFilter: (use: boolean) => void;
  userLocation: { lat: number; lon: number } | null;
}

export const PharmacySearch: React.FC<PharmacySearchProps> = ({
  searchQuery,
  setSearchQuery,
  useLocationFilter,
  setUseLocationFilter,
  userLocation
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleLocationToggle = () => {
    setUseLocationFilter(!useLocationFilter);
  };
  
  return (
    <div className="bg-card rounded-lg border shadow-sm p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by pharmacy name or address..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            id="location-filter"
            checked={useLocationFilter}
            onCheckedChange={handleLocationToggle}
            disabled={!userLocation}
          />
          <label 
            htmlFor="location-filter" 
            className="text-sm cursor-pointer flex items-center gap-1"
          >
            <Locate className="h-4 w-4" />
            <span>Near me</span>
          </label>
        </div>
      </div>
    </div>
  );
};
