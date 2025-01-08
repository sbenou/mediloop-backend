import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { MainNavigationSection } from './MainNavigationSection';
import { CategorySection } from './CategorySection';
import { MoreSection } from './MoreSection';
import { Subcategory } from '@/components/product/types/product';

export const MainNavigation = () => {
  const navigate = useNavigate();
  
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
            category_id,
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

  const getUniqueDescriptions = (subcategory: Subcategory): string[] => {
    if (!subcategory.products) return [];
    
    const descriptions = subcategory.products
      .filter(product => product && typeof product.description === 'string' && product.description.trim() !== '')
      .map(product => product.description);
    
    return [...new Set(descriptions)];
  };

  const getFilteredCategories = (type: 'medication' | 'parapharmacy') => {
    if (!categories) return [];
    const seen = new Set();
    return categories.filter(cat => {
      if (cat.type === type && !seen.has(cat.name)) {
        seen.add(cat.name);
        return true;
      }
      return false;
    });
  };

  const handleCategoryClick = (type: string) => {
    navigate('/products');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('filterProducts', { 
        detail: { type }
      }));
    }, 100);
  };

  return (
    <NavigationMenuList>
      <MainNavigationSection />
      <CategorySection 
        title="Categories"
        type="medication"
        categories={categories || []}
        getFilteredCategories={getFilteredCategories}
        getUniqueDescriptions={getUniqueDescriptions}
        onCategoryClick={handleCategoryClick}
      />
      <MoreSection />
      <NavigationMenuItem>
        <Link 
          to="/contact"
          className="inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
        >
          Contact
        </Link>
      </NavigationMenuItem>
    </NavigationMenuList>
  );
};