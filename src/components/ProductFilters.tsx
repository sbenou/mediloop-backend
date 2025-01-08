import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";
import { FilterCategory } from "./filters/FilterCategory";
import { Product, Subcategory } from "./product/types/product";

interface Category {
  id: string;
  name: string;
  type: 'medication' | 'parapharmacy';
  subcategories: Subcategory[];
}

export const ProductFilters = ({ 
  userRole,
  onFilterChange 
}: { 
  userRole: string | null;
  onFilterChange: (filters: { type?: string; category?: string; subcategory?: string }) => void;
}) => {
  console.log('User Role in ProductFilters:', userRole);

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
              description,
              price,
              image_url,
              type,
              requires_prescription,
              category_id,
              subcategory_id,
              pharmacy_id,
              created_at
            )
          )
        `)
        .order('name');
      
      if (error) throw error;
      console.log('Categories data with products:', data);
      return data as Category[];
    },
  });

  useEffect(() => {
    const handleFilterProducts = (event: CustomEvent<{ type: string; category?: string; subcategory?: string }>) => {
      onFilterChange({
        type: event.detail.type,
        category: event.detail.category,
        subcategory: event.detail.subcategory
      });
    };

    window.addEventListener('filterProducts', handleFilterProducts as EventListener);

    return () => {
      window.removeEventListener('filterProducts', handleFilterProducts as EventListener);
    };
  }, [onFilterChange]);

  const getMedicationCategories = () => {
    if (!categories) return [];
    const seen = new Set();
    return categories.filter(cat => {
      if (cat.type === 'medication' && !seen.has(cat.name)) {
        seen.add(cat.name);
        return true;
      }
      return false;
    });
  };

  const getParapharmacyCategories = () => {
    if (!categories) return [];
    const seen = new Set();
    return categories.filter(cat => {
      if (cat.type === 'parapharmacy' && !seen.has(cat.name)) {
        seen.add(cat.name);
        return true;
      }
      return false;
    });
  };

  return (
    <div className="w-64 flex-shrink-0 border-r pr-4">
      <h3 className="font-semibold mb-4">Filters</h3>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="pharmacy">
            <AccordionTrigger>Pharmacy</AccordionTrigger>
            <AccordionContent>
              {getMedicationCategories().map((category) => (
                <FilterCategory
                  key={category.id}
                  id={category.id}
                  name={category.name}
                  type="medication"
                  subcategories={category.subcategories}
                  onFilterChange={onFilterChange}
                />
              ))}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="parapharmacy">
            <AccordionTrigger>Parapharmacy</AccordionTrigger>
            <AccordionContent>
              {getParapharmacyCategories().map((category) => (
                <FilterCategory
                  key={category.id}
                  id={category.id}
                  name={category.name}
                  type="parapharmacy"
                  subcategories={category.subcategories}
                  onFilterChange={onFilterChange}
                />
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
    </div>
  );
};