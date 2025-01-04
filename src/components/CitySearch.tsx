import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchTerm
          )}&limit=5&featuretype=city`,
          {
            headers: {
              'User-Agent': 'Lovable Health App',
              'Accept-Language': 'en'
            },
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setSuggestions(data);
      } catch (error: any) {
        console.error('Error fetching city suggestions:', error);
        setSuggestions([]);
        
        if (error.name !== 'AbortError') { // Don't show error for aborted requests
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch city suggestions. Please try typing the full city name.",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearch = () => {
    if (value) {
      onSearch(value);
    }
  };

  const handleClear = () => {
    setValue('');
    setSearchTerm('');
    setSuggestions([]);
  };

  const handleSelect = (cityName: string) => {
    setValue(cityName);
    onSearch(cityName);
    setOpen(false);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative flex items-center">
            <Input
              type="text"
              placeholder="Enter your city..."
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setSearchTerm(e.target.value);
                setOpen(true);
              }}
              className="pl-10 pr-24 h-12 text-lg rounded-xl border-gray-200 focus:border-primary focus:ring-primary transition-all duration-200"
            />
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center gap-1 mr-2">
              {value && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="hover:bg-transparent"
                >
                  <X className="h-5 w-5 text-gray-500 hover:text-destructive" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleSearch}
                className="hover:bg-transparent"
              >
                <Search className="h-5 w-5 text-gray-500 hover:text-primary" />
              </Button>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search cities..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Loading..." : "No cities found."}
              </CommandEmpty>
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
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CitySearch;