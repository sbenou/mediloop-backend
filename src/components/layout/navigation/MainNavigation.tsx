import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";

export const MainNavigation = () => {
  const [selectedType, setSelectedType] = useState<'medication' | 'parapharmacy' | null>(null);

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
        <NavigationMenuContent>
          <div className="grid grid-cols-2 gap-4 p-4 w-[600px]">
            {/* Left side - Category Types */}
            <div className="space-y-2 border-r pr-4">
              <button
                onClick={() => setSelectedType('medication')}
                className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
                  selectedType === 'medication' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent'
                }`}
              >
                Pharmacy
              </button>
              <button
                onClick={() => setSelectedType('parapharmacy')}
                className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
                  selectedType === 'parapharmacy' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent'
                }`}
              >
                Parapharmacy
              </button>
            </div>

            {/* Right side - Subcategories and Descriptions */}
            <div className="space-y-4">
              {selectedType && getFilteredCategories(selectedType).map((category) => (
                <div key={category.id} className="space-y-2">
                  {category.subcategories.map((subcategory: any) => (
                    <div key={subcategory.id} className="space-y-1">
                      <h4 className="font-medium text-sm">{subcategory.name}</h4>
                      <div className="pl-3 space-y-1">
                        {getUniqueDescriptions(subcategory).map((description: string, index: number) => (
                          <Link
                            key={`${subcategory.id}-${index}`}
                            to="/products"
                            className="block text-xs text-muted-foreground hover:text-primary"
                          >
                            {description}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {!selectedType && (
                <div className="text-sm text-muted-foreground p-2">
                  Select a category type to view items
                </div>
              )}
            </div>

            {/* Bottom Links */}
            <div className="col-span-2 border-t pt-4 mt-4 space-y-2">
              <NavigationMenuLink asChild>
                <Link 
                  to="/services"
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="text-sm font-medium leading-none">Services</div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    Discover our services
                  </p>
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink asChild>
                <Link 
                  to="/become-partner"
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="text-sm font-medium leading-none">Become a Partner</div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                    Join our network of partners
                  </p>
                </Link>
              </NavigationMenuLink>
            </div>
          </div>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  );
};