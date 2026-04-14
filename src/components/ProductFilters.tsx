
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FilterCategory } from "./filters/FilterCategory";
import { Product, Subcategory } from "./product/types/product";
import { fetchCatalogTree } from "@/services/catalogApi";
import { Button } from "@/components/ui/button";
import { FilterX } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Category {
  id: string;
  name: string;
  type: 'medication' | 'parapharmacy';
  subcategories: Subcategory[];
}

function mapNeonCatalogToCategories(tree: Awaited<ReturnType<typeof fetchCatalogTree>>): Category[] {
  const productType = (t: string): Product["type"] =>
    t === "parapharmacy" ? "parapharmacy" : "medication";
  const categoryType = (t: string): Category["type"] =>
    t === "parapharmacy" ? "parapharmacy" : "medication";

  return tree.map((c) => ({
    id: c.id,
    name: c.name,
    type: categoryType(c.type),
    subcategories: (c.subcategories || []).map(
      (s): Subcategory => ({
        id: s.id,
        name: s.name,
        category_id: c.id,
        products: (s.products || []).map(
          (p): Product => ({
            id: p.id,
            name: p.name,
            description: p.description ?? "",
            price: p.price,
            image_url: p.image_url,
            type: productType(p.type),
            requires_prescription: p.requires_prescription,
            category_id: p.category_id,
            subcategory_id: p.subcategory_id,
            pharmacy_id: p.pharmacy_id,
            created_at: p.created_at || "",
          }),
        ),
      }),
    ),
  }));
}

export const ProductFilters = ({ 
  userRole,
  onFilterChange 
}: { 
  userRole: string | null;
  onFilterChange: (filters: { type?: string; category?: string; subcategory?: string; description?: string }) => void;
}) => {
  console.log('User Role in ProductFilters:', userRole);
  const [activeFilters, setActiveFilters] = useState<boolean>(false);

  const { data: categories } = useQuery({
    queryKey: ['categories', 'product-filters', 'neon'],
    queryFn: async () => {
      try {
        const tree = await fetchCatalogTree();
        const mapped = mapNeonCatalogToCategories(tree);
        console.log('Categories data with products (Neon):', mapped);
        return mapped;
      } catch (e) {
        console.warn(
          '[ProductFilters] Catalog API unavailable (backend /api/catalog/tree, migration_029):',
          e,
        );
        return [];
      }
    },
    retry: 0,
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    const handleFilterProducts = (event: CustomEvent<{ type: string; category?: string; subcategory?: string; description?: string }>) => {
      const filters = {
        type: event.detail.type,
        category: event.detail.category,
        subcategory: event.detail.subcategory,
        description: event.detail.description
      };
      
      setActiveFilters(!!filters.type || !!filters.category || !!filters.subcategory || !!filters.description);
      onFilterChange(filters);
    };

    window.addEventListener('filterProducts', handleFilterProducts as EventListener);

    return () => {
      window.removeEventListener('filterProducts', handleFilterProducts as EventListener);
    };
  }, [onFilterChange]);

  const handleFilterChange = (filters: { type?: string; category?: string; subcategory?: string; description?: string }) => {
    setActiveFilters(!!filters.type || !!filters.category || !!filters.subcategory || !!filters.description);
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
    <div className="w-full border-r pr-3">
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
              {getMedicationCategories().map((category, index, array) => (
                <div key={category.id}>
                  <FilterCategory
                    id={category.id}
                    name={category.name}
                    type="medication"
                    subcategories={category.subcategories}
                    onFilterChange={handleFilterChange}
                  />
                  {/* Add separator after each category except the last one */}
                  {index < array.length - 1 && (
                    <div className="py-2">
                      <Separator />
                    </div>
                  )}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="parapharmacy">
            <AccordionTrigger>Parapharmacy</AccordionTrigger>
            <AccordionContent>
              {getParapharmacyCategories().map((category, index, array) => (
                <div key={category.id}>
                  <FilterCategory
                    id={category.id}
                    name={category.name}
                    type="parapharmacy"
                    subcategories={category.subcategories}
                    onFilterChange={handleFilterChange}
                  />
                  {/* Add separator after each category except the last one */}
                  {index < array.length - 1 && (
                    <div className="py-2">
                      <Separator />
                    </div>
                  )}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
    </div>
  );
};
