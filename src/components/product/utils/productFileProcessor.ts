
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
    const headers = rows[0].split(',').map(header => header.trim());
    
    // First, collect all unique categories and subcategories
    const uniqueCategories = new Set<string>();
    const uniqueSubcategories = new Map<string, Set<string>>();
    
    rows.slice(1).forEach(row => {
      const values = row.split(',').map(value => value.trim());
      const categoryName = values[3];  // Category is in the 4th column
      const subcategoryName = values[4];  // Subcategory is in the 5th column
      const type = values[2].toLowerCase();  // Type is in the 3rd column
      
      if (categoryName && type) {
        uniqueCategories.add(`${categoryName}|${type}`);
        if (!uniqueSubcategories.has(categoryName)) {
          uniqueSubcategories.set(categoryName, new Set());
        }
        if (subcategoryName) {
          uniqueSubcategories.get(categoryName)?.add(subcategoryName);
        }
      }
    });

    // Insert categories if they don't exist
    for (const categoryInfo of uniqueCategories) {
      const [name, type] = categoryInfo.split('|');
      const { data: existingCat } = await supabase
        .from('categories')
        .select('*')
        .eq('name', name)
        .eq('type', type)
        .maybeSingle();

      if (!existingCat) {
        const { data: newCat, error: catError } = await supabase
          .from('categories')
          .insert([{ name, type }])
          .select()
          .single();

        if (catError) {
          console.error('Error creating category:', catError);
          continue;
        }
      }
    }

    // Refresh categories data
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

    // Insert subcategories
    for (const [categoryName, subcategorySet] of uniqueSubcategories) {
      const category = updatedCategories?.find(c => c.name === categoryName);
      if (!category) continue;

      for (const subcategoryName of subcategorySet) {
        const existingSubcat = category.subcategories?.find(s => s.name === subcategoryName);
        
        if (!existingSubcat) {
          const { error: subcatError } = await supabase
            .from('subcategories')
            .insert([{
              name: subcategoryName,
              category_id: category.id
            }]);

          if (subcatError) {
            console.error('Error creating subcategory:', subcatError);
            continue;
          }
        }
      }
    }

    // Refresh categories data again to get updated subcategories
    const { data: finalCategories } = await supabase
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
      const [name, priceStr, typeStr, categoryName, subcategoryName, requires_prescriptionStr, description, image_url] = values;

      if (!name || !priceStr || !typeStr || !categoryName || !subcategoryName) {
        console.error('Missing required fields:', row);
        return null;
      }

      const type = typeStr.toLowerCase();
      const category = finalCategories?.find(c => 
        c.name === categoryName && 
        c.type === type
      );

      if (!category) {
        console.error(`Category not found: ${categoryName}`);
        return null;
      }

      const subcategory = category.subcategories?.find(s => s.name === subcategoryName);

      if (!subcategory) {
        console.error(`Subcategory not found: ${subcategoryName}`);
        return null;
      }

      return {
        name,
        price: parseFloat(priceStr) || 0,
        type,
        requires_prescription: requires_prescriptionStr.toLowerCase() === 'true',
        description: description || '',
        image_url: image_url || null,
        category_id: category.id,
        subcategory_id: subcategory.id
      };
    }).filter(product => product !== null);

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
