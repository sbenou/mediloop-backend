import React from 'react';
import { supabase } from "@/lib/supabase";
import FileUpload from "../FileUpload";
import { toast } from "@/components/ui/use-toast";

export const ProductUploader = () => {
  const handleFileUpload = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') return;
        
        const rows = text.split('\n');
        const products = rows.slice(1).map(row => {
          const [name, price, type, requires_prescription, description] = row.split(',');
          return {
            name: name.trim(),
            price: parseFloat(price),
            type: type.trim(),
            requires_prescription: requires_prescription.trim().toLowerCase() === 'true',
            description: description?.trim(),
          };
        });

        const { error } = await supabase
          .from('products')
          .insert(products);

        if (error) {
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