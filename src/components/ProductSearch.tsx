import { useState } from "react";
import { ProductFilters } from "./ProductFilters";
import { ProductSort } from "./ProductSort";
import { ProductGrid } from "./ProductGrid";
import { ProductSearchBar } from "./ProductSearchBar";
import { ProductPagination } from "./ProductPagination";
import { useProductQuery } from "./product/ProductQueryProvider";
import { ProductUploader } from "./product/ProductUploader";

const ITEMS_PER_PAGE = 12;

export const ProductSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{
    type?: string;
    category?: string;
    subcategory?: string;
  }>({});
  const [sortBy, setSortBy] = useState("newest");

  const { data: productsData, isLoading } = useProductQuery({
    searchTerm,
    currentPage,
    filters,
    sortBy,
    itemsPerPage: ITEMS_PER_PAGE
  });

  // Add console.log to debug products data
  console.log('Products Data:', productsData);

  return (
    <div className="flex gap-6">
      <div className="w-64 space-y-6">
        <ProductFilters 
          userRole={productsData?.userProfile?.role || null}
          onFilterChange={setFilters}
        />
        {productsData?.userProfile?.role === 'pharmacist' && (
          <ProductUploader />
        )}
      </div>
      
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
          userRole={productsData?.userProfile?.role}
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