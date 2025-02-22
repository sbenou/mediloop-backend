
import { supabase } from "@/lib/supabase";
import { Category, Subcategory } from "../types/product";

const validateSuperAdminAccess = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user);
    
    if (!user) throw new Error('No authenticated user found');

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    console.log('Profile query result:', { profile, error });

    if (error) throw error;
    if (!profile || profile.role !== 'superadmin') {
      throw new Error('Permission denied: Only superadmins can upload products');
    }

    return profile;
  } catch (error) {
    console.error('Error in validateSuperAdminAccess:', error);
    throw error;
  }
};

const setupCategoriesAndSubcategories = async (rows: string[]) => {
  // First, collect all unique category-type combinations and their subcategories
  const categoryMap = new Map<string, Set<string>>();
  
  rows.slice(1).forEach(row => {
    const values = row.split(',').map(value => value.trim());
    const [, , typeStr, categoryName, subcategoryName] = values;
    
    if (!categoryName || !typeStr || !subcategoryName) return;
    
    // Convert 'pharmacy' to 'medication' for consistency
    const type = typeStr.toLowerCase() === 'pharmacy' ? 'medication' : typeStr.toLowerCase();
    const key = `${categoryName}|${type}`;
    
    if (!categoryMap.has(key)) {
      categoryMap.set(key, new Set());
    }
    categoryMap.get(key)?.add(subcategoryName);
  });

  // Create categories first
  const categoryIdMap = new Map<string, string>();
  
  for (const [categoryKey, subcategories] of categoryMap) {
    const [name, type] = categoryKey.split('|');
    
    // Check if category exists
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('*')
      .eq('name', name)
      .eq('type', type)
      .maybeSingle();
    
    if (existingCategory) {
      categoryIdMap.set(categoryKey, existingCategory.id);
    } else {
      const { data: newCategory, error: categoryError } = await supabase
        .from('categories')
        .insert([{ name, type }])
        .select()
        .single();
        
      if (categoryError) throw categoryError;
      if (!newCategory) throw new Error(`Failed to create category: ${name} (${type})`);
      
      categoryIdMap.set(categoryKey, newCategory.id);
    }
  }
  
  // Create subcategories
  const subcategoryIdMap = new Map<string, string>();
  
  for (const [categoryKey, subcategoryNames] of categoryMap) {
    const categoryId = categoryIdMap.get(categoryKey);
    if (!categoryId) continue;
    
    for (const subcategoryName of subcategoryNames) {
      const mapKey = `${categoryId}|${subcategoryName}`;
      
      // Check if subcategory exists
      const { data: existingSubcategory } = await supabase
        .from('subcategories')
        .select('*')
        .eq('name', subcategoryName)
        .eq('category_id', categoryId)
        .maybeSingle();
      
      if (existingSubcategory) {
        subcategoryIdMap.set(mapKey, existingSubcategory.id);
      } else {
        const { data: newSubcategory, error: subcategoryError } = await supabase
          .from('subcategories')
          .insert([{
            name: subcategoryName,
            category_id: categoryId
          }])
          .select()
          .single();
          
        if (subcategoryError) throw subcategoryError;
        if (!newSubcategory) throw new Error(`Failed to create subcategory: ${subcategoryName}`);
        
        subcategoryIdMap.set(mapKey, newSubcategory.id);
      }
    }
  }
  
  return { categoryIdMap, subcategoryIdMap };
};

export const processProductFile = async (
  file: File,
  categories: Category[] | undefined,
  subcategories: Subcategory[] | undefined
) => {
  try {
    console.log('Starting file processing...');
    
    // First validate that the current user is a superadmin
    const profile = await validateSuperAdminAccess();
    console.log('Superadmin access validated:', profile);

    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });

    const rows = text.split('\n').filter(row => row.trim() !== '');
    if (rows.length <= 1) {
      throw new Error('File is empty or contains only headers');
    }

    const { categoryIdMap, subcategoryIdMap } = await setupCategoriesAndSubcategories(rows);

    // Process products
    const products = rows.slice(1).map(row => {
      const values = row.split(',').map(value => value.trim());
      const [name, priceStr, typeStr, categoryName, subcategoryName, requires_prescriptionStr, description, image_url] = values;
      
      if (!name || !priceStr || !typeStr || !categoryName || !subcategoryName) {
        console.error('Missing required fields:', { name, priceStr, typeStr, categoryName, subcategoryName });
        return null;
      }

      const type = typeStr.toLowerCase() === 'pharmacy' ? 'medication' : typeStr.toLowerCase();
      const categoryKey = `${categoryName}|${type}`;
      const categoryId = categoryIdMap.get(categoryKey);
      
      if (!categoryId) {
        console.error(`Category not found: ${categoryName} (${type})`);
        return null;
      }
      
      const subcategoryKey = `${categoryId}|${subcategoryName}`;
      const subcategoryId = subcategoryIdMap.get(subcategoryKey);
      
      if (!subcategoryId) {
        console.error(`Subcategory not found: ${subcategoryName}`);
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

    if (products.length === 0) {
      throw new Error('No valid products found in the file');
    }

    // Check for existing products
    const { data: existingProducts, error: existingError } = await supabase
      .from('products')
      .select('name')
      .in('name', products.map(p => p!.name));

    if (existingError) throw existingError;

    const existingProductNames = new Set(existingProducts?.map(p => p.name) || []);
    const newProducts = products.filter(product => !existingProductNames.has(product!.name));
    const skippedCount = products.length - newProducts.length;

    if (newProducts.length > 0) {
      const { error: insertError } = await supabase
        .from('products')
        .insert(newProducts);

      if (insertError) throw insertError;
    }

    return { newProducts, skippedCount };
  } catch (error) {
    console.error('File processing error:', {
      error,
      location: error.stack || 'Stack trace not available'
    });
    throw error;
  }
};
