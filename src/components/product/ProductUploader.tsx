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
          
          // Ensure we have all required values
          if (values.length < 5) {
            console.error('Invalid row format:', row);
            return null;
          }

          const [name, priceStr, typeStr, requires_prescriptionStr, description] = values;

          // Skip invalid rows
          if (!name || !priceStr || !typeStr) {
            console.error('Missing required fields:', row);
            return null;
          }

          const type = typeStr.toLowerCase();
          
          // Find matching category and subcategory based on product type and name
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
        }).filter(product => product !== null); // Remove any invalid products

        if (products.length === 0) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "No valid products found in the CSV file",
          });
          return;
        }

        const { error } = await supabase
          .from('products')
          .insert(products);

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
            description: `${products.length} products uploaded successfully`,
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