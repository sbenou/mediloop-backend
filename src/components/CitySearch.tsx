import React from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface CitySearchProps {
  onSearch: (city: string) => void;
}

const CitySearch = ({ onSearch }: CitySearchProps) => {
  const [value, setValue] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="Enter your city..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="pl-10 h-12 text-lg rounded-xl border-gray-200 focus:border-primary focus:ring-primary transition-all duration-200"
        />
      </div>
    </form>
  );
};

export default CitySearch;