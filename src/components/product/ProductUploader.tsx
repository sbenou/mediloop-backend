import React from 'react';
import { supabase } from "@/lib/supabase";
import FileUpload from "../FileUpload";
import { useQuery } from '@tanstack/react-query';
import { processProductFile } from './utils/productFileProcessor';
import { Category, Subcategory } from './types/product';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export const ProductUploader = () => {
  const { toast } = useToast();
  
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
    const processingToast = toast({
      title: "Processing file",
      description: "Please wait while we process your products file...",
      duration: 5000,
    });

    try {
      const result = await processProductFile(file, categories, subcategories);
      
      // Dismiss the processing toast
      processingToast.dismiss();
      
      if (result.newProducts.length > 0) {
        toast({
          title: "Success",
          description: `Successfully uploaded ${result.newProducts.length} new products. ${result.skippedCount} existing products were skipped.`,
          duration: 5000,
        });
      } else {
        toast({
          variant: "default",
          title: "No new products",
          description: `There were no new products found to upload. All ${result.skippedCount} products already exist in the database.`,
          duration: 5000,
        });
      }
    } catch (error) {
      // Dismiss the processing toast
      processingToast.dismiss();
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process the products file",
        duration: 5000,
      });
    }
  };

  const handleClearProducts = async () => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .neq('id', 0); // This ensures we delete all rows
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "All products have been cleared from the database.",
        duration: 5000,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear products",
        duration: 5000,
      });
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Upload Products</h3>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={handleClearProducts}
        >
          Clear All Products
        </Button>
      </div>
      <FileUpload onFileSelect={handleFileUpload} />
    </div>
  );
};