import { CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";

interface CityResult {
  display_name: string;
  place_id: number;
}

interface CitySearchSuggestionsProps {
  isLoading: boolean;
  suggestions: CityResult[];
  onSelect: (cityName: string) => void;
}

const CitySearchSuggestions = ({ isLoading, suggestions, onSelect }: CitySearchSuggestionsProps) => {
  return (
    <>
      <CommandEmpty>
        {isLoading ? "Loading..." : "No cities found."}
      </CommandEmpty>
      <CommandGroup>
        {suggestions.map((city) => (
          <CommandItem
            key={city.place_id}
            value={city.display_name}
            onSelect={() => onSelect(city.display_name)}
            className="cursor-pointer"
          >
            {city.display_name}
          </CommandItem>
        ))}
      </CommandGroup>
    </>
  );
};

export default CitySearchSuggestions;