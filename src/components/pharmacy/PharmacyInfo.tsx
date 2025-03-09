
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Phone, Mail, MapPin, Edit, Save, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PharmacyInfoProps {
  pharmacy: {
    id: string;
    name: string;
    address: string;
    city: string;
    postal_code: string;
    phone?: string;
    email?: string;
  };
}

const PharmacyInfo: React.FC<PharmacyInfoProps> = ({ pharmacy }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: pharmacy.name,
    address: pharmacy.address,
    city: pharmacy.city,
    postal_code: pharmacy.postal_code,
    phone: pharmacy.phone || '',
    email: pharmacy.email || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('pharmacies')
        .update({
          name: formData.name,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          phone: formData.phone,
          email: formData.email,
        })
        .eq('id', pharmacy.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pharmacy information updated successfully",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating pharmacy:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update pharmacy information",
      });
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="text-sm font-medium">Pharmacy Name</label>
          <Input 
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>
        
        <div>
          <label htmlFor="address" className="text-sm font-medium">Address</label>
          <Input 
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="city" className="text-sm font-medium">City</label>
            <Input 
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="postal_code" className="text-sm font-medium">Postal Code</label>
            <Input 
              id="postal_code"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="phone" className="text-sm font-medium">Phone</label>
          <Input 
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input 
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>
        
        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-medium">{pharmacy.name}</h3>
      </div>
      
      <div className="flex items-start">
        <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
        <div>
          <p className="text-sm">{pharmacy.address}</p>
          <p className="text-sm">{pharmacy.city}, {pharmacy.postal_code}</p>
        </div>
      </div>
      
      {pharmacy.phone && (
        <div className="flex items-center">
          <Phone className="h-4 w-4 mr-2 text-gray-500" />
          <p className="text-sm">{pharmacy.phone}</p>
        </div>
      )}
      
      {pharmacy.email && (
        <div className="flex items-center">
          <Mail className="h-4 w-4 mr-2 text-gray-500" />
          <p className="text-sm">{pharmacy.email}</p>
        </div>
      )}
    </div>
  );
};

export default PharmacyInfo;
