
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

    console.log('File content loaded, parsing rows...');
    const rows = text.split('\n').filter(row => row.trim() !== '');
    console.log(`Found ${rows.length} rows in the file`);
    
    const headers = rows[0].split(',').map(header => header.trim());
    console.log('Headers:', headers);
    
    // First, collect all unique categories and subcategories
    const uniqueCategories = new Set<string>();
    const uniqueSubcategories = new Map<string, Set<string>>();
    
    console.log('Processing rows to collect categories and subcategories...');
    rows.slice(1).forEach(row => {
      const values = row.split(',').map(value => value.trim());
      const [name, price, typeStr, categoryName, subcategoryName] = values;
      
      // Convert 'pharmacy' to 'medication' for consistency with our schema
      const type = typeStr.toLowerCase() === 'pharmacy' ? 'medication' : typeStr.toLowerCase();
      
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

    console.log('Unique categories found:', Array.from(uniqueCategories));
    console.log('Unique subcategories:', Object.fromEntries(uniqueSubcategories));

    // Insert categories if they don't exist
    for (const categoryInfo of uniqueCategories) {
      const [name, type] = categoryInfo.split('|');
      console.log('Processing category:', { name, type });
      
      const { data: existingCat, error: checkError } = await supabase
        .from('categories')
        .select('*')
        .eq('name', name)
        .eq('type', type)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking category:', checkError);
        continue;
      }

      if (!existingCat) {
        console.log('Creating new category:', { name, type });
        const { data: newCat, error: insertError } = await supabase
          .from('categories')
          .insert([{ name, type }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating category:', insertError);
          continue;
        }
        console.log('Created new category:', newCat);
      }
    }

    // Refresh categories data
    const { data: updatedCategories, error: catQueryError } = await supabase
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

    if (catQueryError) {
      console.error('Error fetching updated categories:', catQueryError);
      throw catQueryError;
    }

    // Insert subcategories
    for (const [categoryName, subcategorySet] of uniqueSubcategories) {
      const categoryEntries = updatedCategories?.filter(c => c.name === categoryName) || [];
      
      for (const category of categoryEntries) {
        for (const subcategoryName of subcategorySet) {
          const existingSubcat = category.subcategories?.find(s => s.name === subcategoryName);
          
          if (!existingSubcat) {
            console.log(`Creating new subcategory: ${subcategoryName} for category ${categoryName}`);
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
    }

    // Refresh categories data again to get updated subcategories
    const { data: finalCategories, error: finalCatError } = await supabase
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

    if (finalCatError) {
      console.error('Error fetching final categories:', finalCatError);
      throw finalCatError;
    }

    // Process products
    const products = rows.slice(1).map(row => {
      const values = row.split(',').map(value => value.trim());
      const [name, priceStr, typeStr, categoryName, subcategoryName, requires_prescriptionStr, description, image_url] = values;
      
      // Convert 'pharmacy' to 'medication' for consistency
      const type = typeStr.toLowerCase() === 'pharmacy' ? 'medication' : typeStr.toLowerCase();
      
      console.log('Processing product:', { name, type, categoryName, subcategoryName });

      if (!name || !priceStr || !type || !categoryName || !subcategoryName) {
        console.error('Missing required fields:', values);
        return null;
      }

      const category = finalCategories?.find(c => 
        c.name.toLowerCase() === categoryName.toLowerCase() && 
        c.type.toLowerCase() === type.toLowerCase()
      );

      if (!category) {
        console.error(`Category not found: ${categoryName} (${type})`);
        return null;
      }

      const subcategory = category.subcategories?.find(s => 
        s.name.toLowerCase() === subcategoryName.toLowerCase()
      );

      if (!subcategory) {
        console.error(`Subcategory not found: ${subcategoryName} in category ${categoryName}`);
        return null;
      }

      return {
        name,
        price: parseFloat(priceStr) || 0,
        type,
        requires_prescription: requires_prescriptionStr?.toLowerCase() === 'true',
        description: description || '',
        image_url: image_url || null,
        category_id: category.id,
        subcategory_id: subcategory.id
      };
    }).filter(product => product !== null);

    console.log(`Processed ${products.length} valid products`);

    if (products.length === 0) {
      throw new Error('No valid products found in the file');
    }

    // Check for existing products
    const { data: existingProducts, error: existingError } = await supabase
      .from('products')
      .select('name')
      .in('name', products.map(p => p!.name));

    if (existingError) {
      console.error('Error checking existing products:', existingError);
      throw existingError;
    }

    const existingProductNames = new Set(existingProducts?.map(p => p.name) || []);
    const newProducts = products.filter(product => !existingProductNames.has(product!.name));
    const skippedCount = products.length - newProducts.length;

    console.log(`Products to insert: ${newProducts.length}, Skipped: ${skippedCount}`);

    if (newProducts.length > 0) {
      const { error: insertError } = await supabase
        .from('products')
        .insert(newProducts);

      if (insertError) {
        console.error('Error inserting products:', insertError);
        throw insertError;
      }
      
      console.log('Successfully inserted products');
    }

    return { newProducts, skippedCount };
  } catch (error) {
    console.error('File processing error:', error);
    throw error;
  }
};
