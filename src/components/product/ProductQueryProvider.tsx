
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ProductFiltersState {
  type?: string;
  category?: string;
  subcategory?: string;
  description?: string;
}

export interface ProductQueryConfig {
  searchTerm: string;
  currentPage: number;
  filters: ProductFiltersState;
  sortBy: string;
  itemsPerPage: number;
}

interface UserProfile {
  id: string;
  role: string;
}

interface ProductQueryResult {
  products: any[];
  total: number;
  userProfile: UserProfile | null;
}

export const useProductQuery = ({
  searchTerm,
  currentPage,
  filters,
  sortBy,
  itemsPerPage
}: ProductQueryConfig) => {
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
  });

  return useQuery({
    queryKey: ['products', searchTerm, currentPage, filters, sortBy],
    queryFn: async () => {
      console.log('Fetching products with filters:', filters);
      console.log('User profile:', userProfile);
      
      // First, let's verify the filters being used
      console.log('Category ID:', filters.category);
      console.log('Subcategory ID:', filters.subcategory);
      
      let query = supabase
        .from('products')
        .select('*, categories(*), subcategories(*)', { count: 'exact' });
      
      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      } else if (userProfile?.role !== 'pharmacist' && userProfile?.role !== 'superadmin') {
        query = query.eq('type', 'parapharmacy');
      }
      
      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }
      
      if (filters.subcategory) {
        query = query.eq('subcategory_id', filters.subcategory);
      }

      if (filters.description) {
        query = query.ilike('description', `%${filters.description}%`);
      }
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      // Apply sorting
      switch (sortBy) {
        case 'name':
          query = query.order('name');
          break;
        case 'price-asc':
          query = query.order('price');
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'popular':
          query = query.order('popularity', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }
      
      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      query = query.range(from, from + itemsPerPage - 1);

      // Execute the query and log the raw query for debugging
      console.log('Executing query:', query);
      const { data, error, count } = await query;
      
      console.log('Query result:', { data, error, count });
      
      if (error) {
        console.error('Query error:', error);
        throw error;
      }
      
      return {
        products: data || [],
        total: count || 0,
        userProfile
      } as ProductQueryResult;
    },
    enabled: true,
  });
};
