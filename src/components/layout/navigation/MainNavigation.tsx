import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { NavigationContent } from './NavigationContent';

export const MainNavigation = () => {
  const [selectedType, setSelectedType] = useState<'medication' | 'parapharmacy' | null>(null);
  const [selectedTestType, setSelectedTestType] = useState<'medication' | 'parapharmacy' | null>(null);

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

  const getUniqueDescriptions = (subcategory: any) => {
    if (!subcategory.products) return [];
    
    const descriptions = subcategory.products
      .filter((product: any) => product && typeof product.description === 'string' && product.description.trim() !== '')
      .map((product: any) => product.description);
    
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

  return (
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuTrigger>Navigation</NavigationMenuTrigger>
        <NavigationContent 
          selectedType={selectedType}
          categories={categories || []}
          getFilteredCategories={getFilteredCategories}
          getUniqueDescriptions={getUniqueDescriptions}
        />
      </NavigationMenuItem>

      {/* Test Menu Item */}
      <NavigationMenuItem>
        <NavigationMenuTrigger>Test</NavigationMenuTrigger>
        <NavigationContent 
          selectedType={selectedTestType}
          categories={categories || []}
          getFilteredCategories={getFilteredCategories}
          getUniqueDescriptions={getUniqueDescriptions}
        />
      </NavigationMenuItem>
    </NavigationMenuList>
  );
};