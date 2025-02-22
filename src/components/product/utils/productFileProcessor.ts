
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
      { name: 'Pain Relief', type: 'pharmacy' },
      { name: 'Antibiotics', type: 'pharmacy' },
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
        .maybeSingle();

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

    // Process products
    const products = rows.slice(1).map(row => {
      const values = row.split(',').map(value => value.trim());
      
      if (values.length < 7) {
        console.error('Invalid row format:', row);
        return null;
      }

      const [name, priceStr, typeStr, categoryName, subcategoryName, requires_prescriptionStr, description] = values;

      if (!name || !priceStr || !typeStr || !categoryName || !subcategoryName) {
        console.error('Missing required fields:', row);
        return null;
      }

      const type = typeStr.toLowerCase();
      
      // Find matching category
      const matchedCategory = updatedCategories?.find(c => 
        c.name.toLowerCase() === categoryName.toLowerCase() && 
        c.type === type
      );

      if (!matchedCategory) {
        console.error(`Category not found: ${categoryName}`);
        return null;
      }

      // Find or create subcategory
      let subcategory = matchedCategory.subcategories?.find(s => 
        s.name.toLowerCase() === subcategoryName.toLowerCase()
      );

      if (!subcategory) {
        // Create new subcategory asynchronously
        return {
          name,
          price: parseFloat(priceStr) || 0,
          type,
          requires_prescription: requires_prescriptionStr.toLowerCase() === 'true',
          description: description || '',
          category_id: matchedCategory.id,
          subcategory_name: subcategoryName, // Store subcategory name for creation
          pending_subcategory: true
        };
      }

      return {
        name,
        price: parseFloat(priceStr) || 0,
        type,
        requires_prescription: requires_prescriptionStr.toLowerCase() === 'true',
        description: description || '',
        category_id: matchedCategory.id,
        subcategory_id: subcategory.id,
      };
    }).filter(product => product !== null);

    if (products.length === 0) {
      throw new Error("No valid products found in the CSV file");
    }

    // Handle products with pending subcategories
    for (const product of products) {
      if (product.pending_subcategory) {
        const { data: newSubcategory, error: subError } = await supabase
          .from('subcategories')
          .insert([{
            name: product.subcategory_name,
            category_id: product.category_id
          }])
          .select()
          .single();

        if (subError) {
          console.error('Error creating subcategory:', subError);
          continue;
        }

        // Update product with new subcategory id
        delete product.pending_subcategory;
        delete product.subcategory_name;
        product.subcategory_id = newSubcategory.id;
      }
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
