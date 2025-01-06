import React from 'react';
import { supabase } from "@/lib/supabase";
import FileUpload from "../FileUpload";
import { useQuery } from '@tanstack/react-query';
import { processProductFile } from './utils/productFileProcessor';
import { Category, Subcategory } from './types/product';
import { useToast } from "@/hooks/use-toast";

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
    // Show initial processing toast
    toast({
      title: "Processing file",
      description: "Please wait while we process your products file...",
      duration: 5000,
    });

    try {
      await processProductFile(file, categories, subcategories);
      
      // Show success toast
      toast({
        title: "Success",
        description: "Products have been processed successfully",
        duration: 3000,
      });
    } catch (error) {
      // Show error toast
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process the products file",
        duration: 3000,
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