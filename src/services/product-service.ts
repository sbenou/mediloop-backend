
import { supabase } from '@/lib/supabase';

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string | null;
  requires_prescription: boolean;
  type: 'medication' | 'parapharmacy';
}

export interface AdjacentProduct {
  id: string;
  name: string;
}

export const fetchProduct = async (id: string): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }
  
  if (!data) {
    throw new Error('Product not found');
  }
  
  // Type assertion to ensure the type is either 'medication' or 'parapharmacy'
  const validType = data.type === 'medication' || data.type === 'parapharmacy' 
    ? data.type as 'medication' | 'parapharmacy'
    : 'parapharmacy'; // Default fallback
  
  // Create a valid product object with correct typing
  return {
    id: data.id,
    name: data.name,
    price: data.price,
    description: data.description || undefined,
    image_url: data.image_url,
    requires_prescription: !!data.requires_prescription,
    type: validType
  };
};

export const fetchAdjacentProducts = async (
  currentProductId: string, 
  sortOrder: string
): Promise<{ prevProduct: AdjacentProduct | null; nextProduct: AdjacentProduct | null }> => {
  console.log(`Fetching adjacent products for ${currentProductId} with sort order: ${sortOrder}`);
  
  let orderField = 'created_at';
  let ascending = false;
  
  // Determine order field and direction based on sort order
  switch (sortOrder) {
    case 'name':
      orderField = 'name';
      ascending = true;
      break;
    case 'price-asc':
      orderField = 'price';
      ascending = true;
      break;
    case 'price-desc':
      orderField = 'price';
      ascending = false;
      break;
    case 'popular':
      orderField = 'popularity';
      ascending = false;
      break;
    default: // newest
      orderField = 'created_at';
      ascending = false;
  }
  
  try {
    // Get all products sorted by the selected order field
    const { data: allProducts, error } = await supabase
      .from('products')
      .select('id, name')
      .order(orderField, { ascending: ascending });
      
    if (error) {
      console.error('Error fetching products for navigation:', error);
      return { prevProduct: null, nextProduct: null };
    }
    
    if (!allProducts || allProducts.length === 0) {
      console.log('No products found for navigation');
      return { prevProduct: null, nextProduct: null };
    }
    
    // Find the current product's index in the sorted array
    const currentIndex = allProducts.findIndex(p => p.id === currentProductId);
    console.log(`Current product index: ${currentIndex} of ${allProducts.length} total products`);
    
    if (currentIndex === -1) {
      console.error('Current product not found in products list');
      return { prevProduct: null, nextProduct: null };
    }
    
    // Get previous and next products based on the index
    // Only set prevProduct if we're not at the first item in the sorted list
    const prevProduct = currentIndex > 0 ? allProducts[currentIndex - 1] : null;
    // Only set nextProduct if we're not at the last item in the sorted list
    const nextProduct = currentIndex < allProducts.length - 1 ? allProducts[currentIndex + 1] : null;
    
    console.log('Previous product:', prevProduct);
    console.log('Next product:', nextProduct);
    
    return { prevProduct, nextProduct };
  } catch (err) {
    console.error('Error in fetchAdjacentProducts:', err);
    return { prevProduct: null, nextProduct: null };
  }
};
