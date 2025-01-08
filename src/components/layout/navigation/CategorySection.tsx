import { Category } from '@/components/product/types/product';
import { SubcategoryList } from './SubcategoryList';

interface CategorySectionProps {
  title: string;
  categories: Category[];
  type: 'medication' | 'parapharmacy';
  onCategoryClick: (type: string) => void;
}

export const CategorySection = ({ title, categories, type, onCategoryClick }: CategorySectionProps) => {
  return (
    <div>
      <button
        onClick={() => onCategoryClick(type)}
        className="mb-2 text-sm font-medium hover:text-primary"
      >
        {title}
      </button>
      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category.id} className="space-y-1">
            <SubcategoryList
              subcategories={category.subcategories}
              onCategoryClick={onCategoryClick}
              type={type}
            />
          </div>
        ))}
      </div>
    </div>
  );
};