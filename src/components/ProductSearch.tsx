import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ProductFilters } from "./ProductFilters";
import { ProductSort } from "./ProductSort";
import { ProductGrid } from "./ProductGrid";
import { ProductSearchBar } from "./ProductSearchBar";
import { ProductPagination } from "./ProductPagination";

const ITEMS_PER_PAGE = 12;

interface ProductSearchProps {
  pharmacyId?: string;
}

export const ProductSearch = ({ pharmacyId }: ProductSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{
    type?: string;
    category?: string;
    subcategory?: string;
  }>({});
  const [sortBy, setSortBy] = useState("newest");
  
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', searchTerm, currentPage, filters, sortBy, pharmacyId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });
      
      if (pharmacyId) {
        query = query.eq('pharmacy_id', pharmacyId);
      }
      
      // Apply type filter based on user role
      if (userProfile?.role !== 'pharmacist') {
        query = query.eq('type', 'parapharmacy');
      } else if (filters.type) {
        query = query.eq('type', filters.type);
      }
      
      // Apply category and subcategory filters
      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }
      if (filters.subcategory) {
        query = query.eq('subcategory_id', filters.subcategory);
      }
      
      // Apply search filter
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
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
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      query = query.range(from, from + ITEMS_PER_PAGE - 1);
      
      const { data, error, count } = await query;
      if (error) throw error;
      
      return {
        products: data,
        total: count || 0
      };
    },
    enabled: !!userProfile,
  });

  return (
    <div className="flex gap-6">
      <ProductFilters 
        userRole={userProfile?.role || null}
        onFilterChange={setFilters}
      />
      
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <ProductSearchBar 
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <ProductSort onSortChange={setSortBy} />
        </div>

        <ProductGrid 
          products={productsData?.products || []}
          isLoading={isLoading}
          userRole={userProfile?.role}
        />

        {productsData && productsData.total > ITEMS_PER_PAGE && (
          <ProductPagination
            currentPage={currentPage}
            totalPages={Math.ceil(productsData.total / ITEMS_PER_PAGE)}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};