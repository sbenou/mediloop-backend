import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CitySearchProps {
  onSearch: (city: string) => void;
}

interface CityResult {
  display_name: string;
  place_id: number;
}

const CitySearch = ({ onSearch }: CitySearchProps) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<CityResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchTerm
          )}&limit=5&featuretype=city`
        );
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error('Error fetching city suggestions:', error);
        setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSelect = (cityName: string) => {
    setValue(cityName);
    onSearch(cityName);
    setOpen(false);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Enter your city..."
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setSearchTerm(e.target.value);
                setOpen(true);
              }}
              className="pl-10 h-12 text-lg rounded-xl border-gray-200 focus:border-primary focus:ring-primary transition-all duration-200"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search cities..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandEmpty>No cities found.</CommandEmpty>
            <CommandGroup>
              {suggestions.map((city) => (
                <CommandItem
                  key={city.place_id}
                  value={city.display_name}
                  onSelect={() => handleSelect(city.display_name)}
                  className="cursor-pointer"
                >
                  {city.display_name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CitySearch;