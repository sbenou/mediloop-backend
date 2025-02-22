
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
    
    // First, ensure we have our basic categories
    const basicCategories = [
      { name: 'Pain Relief', type: 'medication' },
      { name: 'Antibiotics', type: 'medication' },
      { name: 'Vitamins', type: 'parapharmacy' },
      { name: 'Skincare', type: 'parapharmacy' }
    ];

    // Insert categories if they don't exist
    for (const cat of basicCategories) {
      const { data: existingCat } = await supabase
        .from('categories')
        .select('*')
        .eq('name', cat.name)
        .eq('type', cat.type)
        .single();

      if (!existingCat) {
        const { data: newCat, error: catError } = await supabase
          .from('categories')
          .insert([cat])
          .select()
          .single();

        if (catError) {
          console.error('Error creating category:', catError);
          continue;
        }

        // Create basic subcategories for each category
        const subcategoriesMap: Record<string, string[]> = {
          'Pain Relief': ['Painkillers', 'Anti-inflammatory'],
          'Antibiotics': ['Broad Spectrum', 'Narrow Spectrum'],
          'Vitamins': ['Multivitamins', 'Mineral Supplements'],
          'Skincare': ['Face Care', 'Body Care']
        };

        const subcategoriesToCreate = subcategoriesMap[cat.name].map(subName => ({
          name: subName,
          category_id: newCat.id
        }));

        const { error: subError } = await supabase
          .from('subcategories')
          .insert(subcategoriesToCreate);

        if (subError) {
          console.error('Error creating subcategories:', subError);
        }
      }
    }

    // Refresh categories and subcategories data
    const { data: updatedCategories } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        type,
        subcategories (
          id,
          name
        )
      `);

    // Process products
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
      const dbType = type === 'pharmacy' ? 'medication' : type;
      
      // Find matching category based on product name keywords
      let matchedCategory = null;
      if (dbType === 'parapharmacy') {
        if (name.toLowerCase().includes('vitamin') || name.toLowerCase().includes('supplement')) {
          matchedCategory = updatedCategories?.find(c => c.name === 'Vitamins' && c.type === dbType);
        } else if (name.toLowerCase().includes('skin') || name.toLowerCase().includes('face') || name.toLowerCase().includes('cream')) {
          matchedCategory = updatedCategories?.find(c => c.name === 'Skincare' && c.type === dbType);
        }
      } else if (dbType === 'medication') {
        if (name.toLowerCase().includes('pain') || name.toLowerCase().includes('relief')) {
          matchedCategory = updatedCategories?.find(c => c.name === 'Pain Relief' && c.type === dbType);
        } else if (name.toLowerCase().includes('antibiotic')) {
          matchedCategory = updatedCategories?.find(c => c.name === 'Antibiotics' && c.type === dbType);
        }
      }

      // If no specific match found, use first category of correct type
      if (!matchedCategory) {
        matchedCategory = updatedCategories?.find(c => c.type === dbType);
      }

      // Find matching subcategory
      let matchedSubcategory = null;
      if (matchedCategory) {
        matchedSubcategory = matchedCategory.subcategories?.[0];
      }

      return {
        name,
        price: parseFloat(priceStr) || 0,
        type: dbType,
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
