import { Category } from '@/components/product/types/product';
import { SubcategoryList } from './SubcategoryList';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface CategorySectionProps {
  title: string;
  categories: Category[];
  type: 'medication' | 'parapharmacy';
  onCategoryClick: (type: string) => void;
}

export const CategorySection = ({ title, categories, type, onCategoryClick }: CategorySectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full mb-2 text-sm font-medium hover:text-primary"
      >
        <span>{title}</span>
        <ChevronDown 
          className={`h-4 w-4 transition-transform ${
            isExpanded ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      
      {isExpanded && (
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
      )}
    </div>
  );
};