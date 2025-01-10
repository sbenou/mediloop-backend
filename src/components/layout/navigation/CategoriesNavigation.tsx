import { useNavigate } from 'react-router-dom';
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CategoryContent } from './CategoryContent';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const CategoriesNavigation = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedType, setSelectedType] = useState<'medication' | 'parapharmacy' | null>(null);
  const { t } = useTranslation();

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

  const getUniqueDescriptions = (subcategory: any): string[] => {
    if (!subcategory.products) return [];
    const descriptions = subcategory.products
      .filter((product: any) => product && typeof product.description === 'string' && product.description.trim() !== '')
      .map((product: any) => product.description as string);
    const uniqueDescriptionsSet = new Set<string>(descriptions);
    return Array.from(uniqueDescriptionsSet);
  };

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>{t('common.navigation.medications')}</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className={`grid gap-3 p-4 ${isMobile ? 'w-[300px]' : 'w-[600px]'} md:grid-cols-2`}>
          <CategoryContent 
            categories={categories || []}
            getUniqueCategories={getUniqueCategories}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            getUniqueDescriptions={getUniqueDescriptions}
          />
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};