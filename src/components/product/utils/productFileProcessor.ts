import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { Category, Subcategory } from "../types/product";

export const processProductFile = async (
  file: File,
  categories: Category[] | undefined,
  subcategories: Subcategory[] | undefined
) => {
  const processingToast = toast({
    title: "Processing file",
    description: "Please wait while we process your products file...",
    duration: Infinity, // Keep until dismissed
  });

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
      processingToast.dismiss();
      toast({
        variant: "destructive",
        title: "Error",
        description: "No valid products found in the CSV file",
        duration: 3000,
      });
      return;
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

    processingToast.dismiss();

    if (newProducts.length === 0) {
      toast({
        variant: "destructive",
        title: "No new products",
        description: `All ${skippedCount} products already exist in the database.`,
        duration: 3000,
      });
      return;
    }

    const { error } = await supabase
      .from('products')
      .insert(newProducts);

    if (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload products: " + error.message,
        duration: 3000,
      });
    } else {
      toast({
        title: "Success",
        description: `${newProducts.length} new products uploaded successfully. ${skippedCount} products were skipped as they already existed.`,
        duration: 3000,
      });
    }
  } catch (error) {
    processingToast.dismiss();
    console.error('File processing error:', error);
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to process file",
      duration: 3000,
    });
  }
};