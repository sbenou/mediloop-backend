import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import { Subcategory } from '@/components/product/types/product';

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

  return (
    <NavigationMenuList>
      {/* Main Navigation Menu */}
      <NavigationMenuItem>
        <NavigationMenuTrigger>Navigation</NavigationMenuTrigger>
        <NavigationMenuContent>
          <div className="grid w-[400px] gap-3 p-4">
            <Link 
              to="/products"
              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            >
              <div className="text-sm font-medium leading-none">Products</div>
              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                Browse our products catalog
              </p>
            </Link>
            <Link 
              to="/services"
              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            >
              <div className="text-sm font-medium leading-none">Services</div>
              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                Discover our services
              </p>
            </Link>
            <Link 
              to="/become-partner"
              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            >
              <div className="text-sm font-medium leading-none">Become a Partner</div>
              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                Join our network of partners
              </p>
            </Link>
          </div>
        </NavigationMenuContent>
      </NavigationMenuItem>

      {/* Categories Menu */}
      <NavigationMenuItem>
        <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
        <NavigationMenuContent>
          <div className="grid grid-cols-2 gap-4 p-4 w-[600px]">
            <div className="space-y-4">
              <button
                onClick={() => setSelectedType('medication')}
                className={`w-full text-left px-4 py-2 rounded ${
                  selectedType === 'medication' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Medication
              </button>
              <button
                onClick={() => setSelectedType('parapharmacy')}
                className={`w-full text-left px-4 py-2 rounded ${
                  selectedType === 'parapharmacy' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                Parapharmacy
              </button>
            </div>

            <div className="space-y-4">
              {selectedType && getFilteredCategories(selectedType).map((category) => (
                <div key={category.id} className="space-y-2">
                  <h3 className="font-medium">{category.name}</h3>
                  {category.subcategories?.map((subcategory) => (
                    <div key={subcategory.id} className="ml-4 space-y-1">
                      <h4 className="text-sm font-medium">{subcategory.name}</h4>
                      <div className="ml-4 text-sm text-muted-foreground">
                        {getUniqueDescriptions(subcategory).map((description, index) => (
                          <p key={index} className="line-clamp-2">{description}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  );
};