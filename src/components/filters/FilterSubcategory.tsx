import { useNavigate } from 'react-router-dom';
import { Subcategory } from "@/components/product/types/product";
import { FilterDescription } from "./FilterDescription";

interface FilterSubcategoryProps {
  subcategory: Subcategory;
  categoryId: string;
  type: 'medication' | 'parapharmacy';
  onFilterChange: (filters: { type?: string; category?: string; subcategory?: string }) => void;
}

export const FilterSubcategory = ({ 
  subcategory,
  categoryId,
  type,
  onFilterChange 
}: FilterSubcategoryProps) => {
  const navigate = useNavigate();

  const handleSubcategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Subcategory clicked:', { type, categoryId, subcategoryId: subcategory.id });
    onFilterChange({ type, category: categoryId, subcategory: subcategory.id });
    navigate('/products');
  };

  const getUniqueDescriptions = () => {
    if (!subcategory.products) return [];
    
    const descriptions = subcategory.products
      .filter(product => product && typeof product.description === 'string' && product.description.trim() !== '')
      .map(product => product.description);
    
    return [...new Set(descriptions)];
  };

  return (
    <div className="space-y-1">
      <a
        href="#"
        onClick={handleSubcategoryClick}
        className="text-sm text-muted-foreground hover:text-primary block w-full text-left py-1 cursor-pointer"
      >
        {subcategory.name}
      </a>
      <div className="pl-4 space-y-1">
        {getUniqueDescriptions().map((description, index) => (
          <FilterDescription
            key={`${subcategory.id}-${index}`}
            description={description}
            categoryId={categoryId}
            subcategoryId={subcategory.id}
            type={type}
            onFilterChange={onFilterChange}
          />
        ))}
      </div>
    </div>
  );
};