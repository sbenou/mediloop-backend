
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
  
  // Get current product details for comparison
  const { data: currentProduct } = await supabase
    .from('products')
    .select(`id, name, ${orderField}`)
    .eq('id', currentProductId)
    .single();
    
  if (!currentProduct) {
    console.error('Could not find current product for comparison');
    return { prevProduct: null, nextProduct: null };
  }
  
  // Log for debugging
  console.log(`Current product: ${currentProduct.id} - ${currentProduct.name}`);
  console.log(`Using order field: ${orderField}, ascending: ${ascending}`);
  console.log(`Order value: ${currentProduct[orderField as keyof typeof currentProduct]}`);
  
  const compareValue = currentProduct[orderField as keyof typeof currentProduct];
  
  // For debugging
  const logQuery = (direction: string, operator: string) => {
    console.log(`${direction} query: SELECT id, name FROM products WHERE ${orderField} ${operator} ${compareValue} ORDER BY ${orderField} ${direction === 'prev' ? 'DESC' : 'ASC'} LIMIT 1`);
  };
  
  // Log the queries we're about to run
  logQuery('prev', ascending ? '<' : '>');
  logQuery('next', ascending ? '>' : '<');
  
  // Fetch previous product with improved query
  const { data: prevData, error: prevError } = await supabase
    .from('products')
    .select('id, name')
    .filter(orderField, ascending ? 'lt' : 'gt', compareValue)
    .order(orderField, { ascending: !ascending })
    .limit(1);
  
  if (prevError) {
    console.error('Error fetching previous product:', prevError);
  }
  
  // Fetch next product with improved query
  const { data: nextData, error: nextError } = await supabase
    .from('products')
    .select('id, name')
    .filter(orderField, ascending ? 'gt' : 'lt', compareValue)
    .order(orderField, { ascending: ascending })
    .limit(1);
  
  if (nextError) {
    console.error('Error fetching next product:', nextError);
  }
  
  console.log('Previous product data:', prevData);
  console.log('Next product data:', nextData);
  
  // Return the adjacent products
  return {
    prevProduct: prevData && prevData.length > 0 ? prevData[0] : null,
    nextProduct: nextData && nextData.length > 0 ? nextData[0] : null
  };
};
