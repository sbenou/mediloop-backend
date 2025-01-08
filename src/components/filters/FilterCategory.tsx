import { Badge } from "@/components/ui/badge";
import { FilterSubcategory } from "./FilterSubcategory";
import { Subcategory } from "@/components/product/types/product";

interface FilterCategoryProps {
  id: string;
  name: string;
  type: 'medication' | 'parapharmacy';
  subcategories: Subcategory[];
  onFilterChange: (filters: { type?: string; category?: string; subcategory?: string }) => void;
}

export const FilterCategory = ({ 
  id, 
  name, 
  type, 
  subcategories,
  onFilterChange 
}: FilterCategoryProps) => {
  return (
    <div className="py-2">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onFilterChange({ type, category: id });
        }}
        className="text-sm hover:text-primary w-full text-left block"
      >
        {name}
        <Badge variant="secondary" className="ml-2">
          {subcategories.length}
        </Badge>
      </a>
      <div className="ml-4 space-y-1 mt-1">
        {subcategories.map((sub) => (
          <FilterSubcategory
            key={sub.id}
            subcategory={sub}
            categoryId={id}
            type={type}
            onFilterChange={onFilterChange}
          />
        ))}
      </div>
    </div>
  );
};