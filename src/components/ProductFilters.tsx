import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface Category {
  id: string;
  name: string;
  type: 'medication' | 'parapharmacy';
  subcategories: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

export const ProductFilters = ({ 
  userRole,
  onFilterChange 
}: { 
  userRole: string | null;
  onFilterChange: (filters: { type?: string; category?: string; subcategory?: string }) => void;
}) => {
  // Debug logs
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
            name
          )
        `)
        .order('name');
      
      if (error) throw error;
      console.log('Categories data:', data);
      return data as Category[];
    },
  });

  // Debug log for categories
  console.log('Filtered medication categories:', categories?.filter(cat => cat.type === 'medication'));
  console.log('Show pharmacy section condition:', userRole === 'pharmacist' || userRole === 'superadmin');

  return (
    <div className="w-64 flex-shrink-0 border-r pr-4">
      <h3 className="font-semibold mb-4">Filters</h3>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <Accordion type="single" collapsible className="w-full">
          {(userRole === 'pharmacist' || userRole === 'superadmin') && (
            <AccordionItem value="pharmacy">
              <AccordionTrigger>Pharmacy</AccordionTrigger>
              <AccordionContent>
                {categories?.filter(cat => cat.type === 'medication').map((category) => (
                  <div key={category.id} className="py-2">
                    <button
                      onClick={() => onFilterChange({ type: 'medication', category: category.id })}
                      className="text-sm hover:text-primary w-full text-left"
                    >
                      {category.name}
                      <Badge variant="secondary" className="ml-2">
                        {category.subcategories.length}
                      </Badge>
                    </button>
                    <div className="ml-4 space-y-1 mt-1">
                      {category.subcategories.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => onFilterChange({ type: 'medication', category: category.id, subcategory: sub.id })}
                          className="text-sm text-muted-foreground hover:text-primary block w-full text-left py-1"
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}
          <AccordionItem value="parapharmacy">
            <AccordionTrigger>Parapharmacy</AccordionTrigger>
            <AccordionContent>
              {categories?.filter(cat => cat.type === 'parapharmacy').map((category) => (
                <div key={category.id} className="py-2">
                  <button
                    onClick={() => onFilterChange({ type: 'parapharmacy', category: category.id })}
                    className="text-sm hover:text-primary w-full text-left"
                  >
                    {category.name}
                    <Badge variant="secondary" className="ml-2">
                      {category.subcategories.length}
                    </Badge>
                  </button>
                  <div className="ml-4 space-y-1 mt-1">
                    {category.subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => onFilterChange({ type: 'parapharmacy', category: category.id, subcategory: sub.id })}
                        className="text-sm text-muted-foreground hover:text-primary block w-full text-left py-1"
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
    </div>
  );
};