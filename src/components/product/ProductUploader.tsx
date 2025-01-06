import React from 'react';
import { supabase } from "@/lib/supabase";
import FileUpload from "../FileUpload";
import { useQuery } from '@tanstack/react-query';
import { processProductFile } from './utils/productFileProcessor';
import { Category, Subcategory } from './types/product';

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
    await processProductFile(file, categories, subcategories);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-medium mb-4">Upload Products</h3>
      <FileUpload onFileSelect={handleFileUpload} />
    </div>
  );
};