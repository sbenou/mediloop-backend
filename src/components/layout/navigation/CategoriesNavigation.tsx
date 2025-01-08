import { useNavigate } from 'react-router-dom';
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const CategoriesNavigation = () => {
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
            name
          )
        `)
        .order('name');
      
      if (error) throw error;
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

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid gap-3 p-4 w-[400px]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="mb-2 text-sm font-medium">Pharmacy</h4>
              <div className="space-y-2">
                {categories?.filter(cat => cat.type === 'medication').map((category) => (
                  <div key={category.id} className="space-y-1">
                    <button
                      onClick={() => handleCategoryClick('medication')}
                      className="block w-full text-left text-sm text-muted-foreground hover:text-primary"
                    >
                      {category.name}
                    </button>
                    {category.subcategories?.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleCategoryClick('medication')}
                        className="block w-full text-left text-sm text-muted-foreground hover:text-primary pl-2"
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium">Parapharmacy</h4>
              <div className="space-y-2">
                {categories?.filter(cat => cat.type === 'parapharmacy').map((category) => (
                  <div key={category.id} className="space-y-1">
                    <button
                      onClick={() => handleCategoryClick('parapharmacy')}
                      className="block w-full text-left text-sm text-muted-foreground hover:text-primary"
                    >
                      {category.name}
                    </button>
                    {category.subcategories?.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleCategoryClick('parapharmacy')}
                        className="block w-full text-left text-sm text-muted-foreground hover:text-primary pl-2"
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};