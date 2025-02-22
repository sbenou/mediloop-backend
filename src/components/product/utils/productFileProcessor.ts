
import { supabase } from "@/lib/supabase";
import { Category, Subcategory } from "../types/product";

export const processProductFile = async (
  file: File,
  categories: Category[] | undefined,
  subcategories: Subcategory[] | undefined
) => {
  try {
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });

    const rows = text.split('\n').filter(row => row.trim() !== '');
    const products = rows.slice(1).map(row => {
      const values = row.split(',').map(value => value.trim());
      
      if (values.length < 5) {
        console.error('Invalid row format:', row);
        return null;
      }

      const [name, priceStr, typeStr, requires_prescriptionStr, description] = values;

      if (!name || !priceStr || !typeStr) {
        console.error('Missing required fields:', row);
        return null;
      }

      const type = typeStr.toLowerCase();
      
      // Find matching category based on product name keywords
      let matchedCategory = null;
      if (type === 'parapharmacy') {
        if (name.toLowerCase().includes('vitamin') || name.toLowerCase().includes('supplement')) {
          matchedCategory = categories?.find(c => c.name.toLowerCase() === 'vitamins' && c.type === type);
        } else if (name.toLowerCase().includes('skin') || name.toLowerCase().includes('face') || name.toLowerCase().includes('cream')) {
          matchedCategory = categories?.find(c => c.name.toLowerCase() === 'skincare' && c.type === type);
        }
      } else if (type === 'medication') {
        if (name.toLowerCase().includes('pain') || name.toLowerCase().includes('relief')) {
          matchedCategory = categories?.find(c => c.name.toLowerCase() === 'pain relief' && c.type === type);
        } else if (name.toLowerCase().includes('antibiotic')) {
          matchedCategory = categories?.find(c => c.name.toLowerCase() === 'antibiotics' && c.type === type);
        }
      }

      // If no specific match found, try to find any category of the correct type
      if (!matchedCategory) {
        matchedCategory = categories?.find(c => c.type === type);
      }

      // Find matching subcategory
      let matchedSubcategory = null;
      if (matchedCategory) {
        if (type === 'parapharmacy') {
          if (name.toLowerCase().includes('vitamin')) {
            matchedSubcategory = subcategories?.find(s => 
              s.category_id === matchedCategory.id && 
              s.name.toLowerCase() === 'multivitamins'
            );
          } else if (name.toLowerCase().includes('face') || name.toLowerCase().includes('cream')) {
            matchedSubcategory = subcategories?.find(s => 
              s.category_id === matchedCategory.id && 
              s.name.toLowerCase() === 'face care'
            );
          }
        } else if (type === 'medication') {
          if (name.toLowerCase().includes('pain')) {
            matchedSubcategory = subcategories?.find(s => 
              s.category_id === matchedCategory.id && 
              s.name.toLowerCase() === 'painkillers'
            );
          } else if (name.toLowerCase().includes('antibiotic')) {
            matchedSubcategory = subcategories?.find(s => 
              s.category_id === matchedCategory.id && 
              s.name.toLowerCase() === 'broad spectrum'
            );
          }
        }

        // If no specific match found, use the first subcategory of the category
        if (!matchedSubcategory) {
          matchedSubcategory = subcategories?.find(s => s.category_id === matchedCategory.id);
        }
      }

      console.log(`Mapping product "${name}" (${type}):`, {
        category: matchedCategory?.name,
        subcategory: matchedSubcategory?.name
      });

      return {
        name,
        price: parseFloat(priceStr) || 0,
        type,
        requires_prescription: requires_prescriptionStr.toLowerCase() === 'true',
        description: description || '',
        category_id: matchedCategory?.id || null,
        subcategory_id: matchedSubcategory?.id || null,
      };
    }).filter(product => product !== null);

    if (products.length === 0) {
      throw new Error("No valid products found in the CSV file");
    }

    let newProducts = [];
    let skippedCount = 0;

    // Check for existing products in a single query
    const { data: existingProducts } = await supabase
      .from('products')
      .select('name')
      .in('name', products.map(p => p!.name));

    const existingProductNames = new Set(existingProducts?.map(p => p.name) || []);

    // Filter out existing products
    newProducts = products.filter(product => !existingProductNames.has(product!.name));
    skippedCount = products.length - newProducts.length;

    if (newProducts.length > 0) {
      const { error } = await supabase
        .from('products')
        .insert(newProducts);

      if (error) {
        throw error;
      }
    }

    return { newProducts, skippedCount };
  } catch (error) {
    console.error('File processing error:', error);
    throw error;
  }
};
