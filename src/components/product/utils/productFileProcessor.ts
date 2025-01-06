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
      
      const category = categories?.find(c => 
        c.type === type && 
        name.toLowerCase().includes(c.name.toLowerCase())
      );

      let subcategory = null;
      if (category) {
        subcategory = subcategories?.find(s => 
          s.category_id === category.id && 
          name.toLowerCase().includes(s.name.toLowerCase())
        );
      }

      return {
        name,
        price: parseFloat(priceStr) || 0,
        type,
        requires_prescription: requires_prescriptionStr.toLowerCase() === 'true',
        description: description || '',
        category_id: category?.id || null,
        subcategory_id: subcategory?.id || null,
      };
    }).filter(product => product !== null);

    if (products.length === 0) {
      throw new Error("No valid products found in the CSV file");
    }

    let newProducts = [];
    let skippedCount = 0;

    for (const product of products) {
      const { data: existingProduct } = await supabase
        .from('products')
        .select('name')
        .eq('name', product.name)
        .maybeSingle();

      if (!existingProduct) {
        newProducts.push(product);
      } else {
        skippedCount++;
      }
    }

    if (newProducts.length === 0) {
      throw new Error(`All ${skippedCount} products already exist in the database.`);
    }

    const { error } = await supabase
      .from('products')
      .insert(newProducts);

    if (error) {
      throw error;
    }

    return { newProducts, skippedCount };
  } catch (error) {
    console.error('File processing error:', error);
    throw error;
  }
};