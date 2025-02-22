
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

    // Insert categories if they don't exist
    const createdCategories = new Map<string, string>();
    
    for (const categoryInfo of uniqueCategories) {
      const [name, type] = categoryInfo.split('|');
      console.log('Processing category:', { name, type });
      
      try {
        // Try to find existing category
        const { data: existingCat } = await supabase
          .from('categories')
          .select('*')
          .eq('name', name)
          .eq('type', type)
          .maybeSingle();

        if (!existingCat) {
          // Create new category
          const { data: newCat, error: insertError } = await supabase
            .from('categories')
            .insert([{ name, type }])
            .select()
            .single();

          if (insertError) throw insertError;
          if (!newCat) throw new Error('Failed to create category');
          
          console.log('Created new category:', newCat);
          createdCategories.set(categoryInfo, newCat.id);
        } else {
          console.log('Found existing category:', existingCat);
          createdCategories.set(categoryInfo, existingCat.id);
        }
      } catch (error) {
        console.error(`Error processing category ${name}:`, error);
        throw new Error(`Failed to process category ${name}`);
      }
    }

    // Verify all categories were created
    if (createdCategories.size !== uniqueCategories.size) {
      throw new Error('Not all categories were created successfully');
    }

    // Insert subcategories
    const createdSubcategories = new Map<string, string>();
    
    for (const [categoryName, subcategorySet] of uniqueSubcategories) {
      for (const subcategoryName of subcategorySet) {
        const relevantCategories = Array.from(createdCategories.entries())
          .filter(([key]) => key.startsWith(categoryName + '|'))
          .map(([_, id]) => id);

        for (const categoryId of relevantCategories) {
          try {
            // Check if subcategory exists
            const { data: existingSubcat } = await supabase
              .from('subcategories')
              .select('*')
              .eq('name', subcategoryName)
              .eq('category_id', categoryId)
              .maybeSingle();

            if (!existingSubcat) {
              // Create new subcategory
              const { data: newSubcat, error: insertError } = await supabase
                .from('subcategories')
                .insert([{
                  name: subcategoryName,
                  category_id: categoryId
                }])
                .select()
                .single();

              if (insertError) throw insertError;
              if (!newSubcat) throw new Error('Failed to create subcategory');
              
              console.log('Created new subcategory:', newSubcat);
              createdSubcategories.set(`${categoryId}|${subcategoryName}`, newSubcat.id);
            } else {
              console.log('Found existing subcategory:', existingSubcat);
              createdSubcategories.set(`${categoryId}|${subcategoryName}`, existingSubcat.id);
            }
          } catch (error) {
            console.error(`Error processing subcategory ${subcategoryName}:`, error);
            throw new Error(`Failed to process subcategory ${subcategoryName}`);
          }
        }
      }
    }

    // Process products
    const products = rows.slice(1).map(row => {
      const values = row.split(',').map(value => value.trim());
      const [name, priceStr, typeStr, categoryName, subcategoryName, requires_prescriptionStr, description, image_url] = values;
      
      // Convert 'pharmacy' to 'medication' for consistency
      const type = typeStr.toLowerCase() === 'pharmacy' ? 'medication' : typeStr.toLowerCase();
      
      if (!name || !priceStr || !type || !categoryName || !subcategoryName) {
        console.error('Missing required fields:', values);
        return null;
      }

      const categoryKey = `${categoryName}|${type}`;
      const categoryId = createdCategories.get(categoryKey);
      
      if (!categoryId) {
        console.error(`Category not found for key: ${categoryKey}`);
        return null;
      }

      const subcategoryKey = `${categoryId}|${subcategoryName}`;
      const subcategoryId = createdSubcategories.get(subcategoryKey);
      
      if (!subcategoryId) {
        console.error(`Subcategory not found for key: ${subcategoryKey}`);
        return null;
      }

      return {
        name,
        price: parseFloat(priceStr) || 0,
        type,
        requires_prescription: requires_prescriptionStr?.toLowerCase() === 'true',
        description: description || '',
        image_url: image_url || null,
        category_id: categoryId,
        subcategory_id: subcategoryId
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
