import { useNavigate } from 'react-router-dom';
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CategorySection } from './CategorySection';
import { useIsMobile } from '@/hooks/use-mobile';

export const CategoriesNavigation = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          type,
          subcategories (
            id,
            name,
            products (
              id,
              name,
              description
            )
          )
        `)
        .order('name');
      
      if (error) throw error;
      console.log('Categories with products:', data);
      return data;
    },
  });

  const handleCategoryClick = (type: string) => {
    navigate('/products');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('filterProducts', { 
        detail: { type }
      }));
    }, 100);
  };

  const getUniqueCategories = (categories: any[], type: string) => {
    const seen = new Set();
    return categories?.filter(cat => {
      if (cat.type === type && !seen.has(cat.name)) {
        seen.add(cat.name);
        return true;
      }
      return false;
    }) || [];
  };

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className={`grid gap-3 p-4 ${isMobile ? 'w-[300px]' : 'w-[400px]'}`}>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
            <CategorySection
              title="Pharmacy"
              categories={getUniqueCategories(categories || [], 'medication')}
              type="medication"
              onCategoryClick={handleCategoryClick}
            />
            <CategorySection
              title="Parapharmacy"
              categories={getUniqueCategories(categories || [], 'parapharmacy')}
              type="parapharmacy"
              onCategoryClick={handleCategoryClick}
            />
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};