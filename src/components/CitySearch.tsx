import React, { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Command, CommandInput, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { searchCity } from '@/services/geocoding';
import CitySearchSuggestions from './city/CitySearchSuggestions';
import { useDebouncedCallback } from 'use-debounce';

interface CitySearchProps {
  onSearch: (city: string) => void;
}

const CitySearch = ({ onSearch }: CitySearchProps) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; place_id: number }>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Debounce the fetch suggestions function
  const debouncedFetchSuggestions = useDebouncedCallback(async (term: string) => {
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchCity(term);
      setSuggestions(results);
      setOpen(true); // Ensure popover is open when we have results
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch city suggestions. Please try typing the full city name.",
      });
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, 500); // 500ms debounce

  useEffect(() => {
    if (searchTerm) {
      debouncedFetchSuggestions(searchTerm);
    }
    return () => {
      debouncedFetchSuggestions.cancel();
    };
  }, [searchTerm, debouncedFetchSuggestions]);

  const handleSearch = () => {
    if (value) {
      onSearch(value);
      setOpen(false);
    }
  };

  const handleClear = () => {
    setValue('');
    setSearchTerm('');
    setSuggestions([]);
    setOpen(false);
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
                const newValue = e.target.value;
                setValue(newValue);
                setSearchTerm(newValue);
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
              <CitySearchSuggestions
                isLoading={isLoading}
                suggestions={suggestions}
                onSelect={handleSelect}
              />
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CitySearch;