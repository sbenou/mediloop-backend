
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { FilterCategory } from "./filters/FilterCategory";
import { Product, Subcategory } from "./product/types/product";
import { Button } from "@/components/ui/button";
import { FilterX } from "lucide-react";

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
  const [activeFilters, setActiveFilters] = useState<boolean>(false);

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
      const filters = {
        type: event.detail.type,
        category: event.detail.category,
        subcategory: event.detail.subcategory
      };
      
      setActiveFilters(!!filters.type || !!filters.category || !!filters.subcategory);
      onFilterChange(filters);
    };

    window.addEventListener('filterProducts', handleFilterProducts as EventListener);

    return () => {
      window.removeEventListener('filterProducts', handleFilterProducts as EventListener);
    };
  }, [onFilterChange]);

  const handleFilterChange = (filters: { type?: string; category?: string; subcategory?: string }) => {
    setActiveFilters(!!filters.type || !!filters.category || !!filters.subcategory);
    onFilterChange(filters);
  };

  const clearFilters = () => {
    console.log('Clearing all filters');
    setActiveFilters(false);
    onFilterChange({});
  };

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
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Filters</h3>
        {activeFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-muted-foreground hover:text-primary"
          >
            <FilterX className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
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
                  onFilterChange={handleFilterChange}
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
                  onFilterChange={handleFilterChange}
                />
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
    </div>
  );
};
