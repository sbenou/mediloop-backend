import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ProductSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const ProductSearchBar = ({ value, onChange }: ProductSearchBarProps) => {
  return (
    <div className="relative w-96">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search products..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};