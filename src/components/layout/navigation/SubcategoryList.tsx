import { Subcategory } from '@/components/product/types/product';

interface SubcategoryListProps {
  subcategories: Subcategory[];
  onCategoryClick: (type: string) => void;
  type: 'medication' | 'parapharmacy';
}

export const SubcategoryList = ({ subcategories, onCategoryClick, type }: SubcategoryListProps) => {
  return (
    <div className="space-y-1">
      {subcategories.map((sub) => (
        <button
          key={sub.id}
          onClick={() => onCategoryClick(type)}
          className="block w-full text-left text-sm text-muted-foreground hover:text-primary pl-2"
        >
          {sub.name}
        </button>
      ))}
    </div>
  );
};