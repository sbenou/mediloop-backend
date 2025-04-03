
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Category clicked:', { type, categoryId: id });
    onFilterChange({ type, category: id });
    navigate('/products');
  };

  // Count total products in all subcategories
  const totalProducts = subcategories.reduce((total, sub) => 
    total + (sub.products?.length || 0), 0);

  return (
    <div className="py-2">
      <a
        href="#"
        onClick={handleCategoryClick}
        className="flex items-center justify-between w-full text-sm hover:text-primary cursor-pointer"
      >
        <span>{name}</span>
        <Badge variant="secondary" className="text-xs ml-2">
          {totalProducts}
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
