import React from 'react';
import { supabase } from "@/lib/supabase";
import FileUpload from "../FileUpload";
import { toast } from "@/hooks/use-toast";
import { useQuery } from '@tanstack/react-query';

interface Category {
  id: string;
  name: string;
  type: 'medication' | 'parapharmacy';
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

export const ProductUploader = () => {
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      if (error) throw error;
      return data as Category[];
    }
  });

  const { data: subcategories } = useQuery({
    queryKey: ['subcategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*');
      if (error) throw error;
      return data as Subcategory[];
    }
  });

  if (userProfile?.role !== 'superadmin') {
    return (
      <div className="p-4 border rounded-lg">
        <p className="text-red-500">Only super administrators can upload products.</p>
      </div>
    );
  }

  const handleFileUpload = async (file: File) => {
    const toastId = toast({
      title: "Processing file",
      description: "Please wait while we process your products file...",
    });

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to read file content",
          });
          return;
        }
        
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
          toast({
            variant: "destructive",
            title: "Error",
            description: "No valid products found in the CSV file",
          });
          return;
        }

        let newProducts = [];
        let skippedCount = 0;

        // Process each product one by one
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

        // Dismiss the processing toast
        toast({
          id: toastId,
          title: "Processing complete",
          description: "File processing has finished.",
        });

        if (newProducts.length === 0) {
          toast({
            variant: "destructive",
            title: "No new products",
            description: `All ${skippedCount} products already exist in the database.`,
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
          });
        } else {
          toast({
            title: "Success",
            description: `${newProducts.length} new products uploaded successfully. ${skippedCount} products were skipped as they already existed.`,
          });
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('File processing error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process file",
      });
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-medium mb-4">Upload Products</h3>
      <FileUpload onFileSelect={handleFileUpload} />
    </div>
  );
};