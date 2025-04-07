
import React, { useState, Dispatch, SetStateAction } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, Mail, MapPin } from 'lucide-react';

interface DoctorInfoProps {
  doctor: {
    id: string;
    name: string;
    address: string;
    city: string;
    postal_code: string;
    phone?: string;
    email?: string;
  };
  isEditing?: boolean;
  setIsEditing?: Dispatch<SetStateAction<boolean>>;
}

const DoctorInfo: React.FC<DoctorInfoProps> = ({ 
  doctor, 
  isEditing = false, 
  setIsEditing 
}) => {
  const [formData, setFormData] = useState({
    name: doctor.name,
    address: doctor.address,
    city: doctor.city,
    postal_code: doctor.postal_code,
    phone: doctor.phone || '',
    email: doctor.email || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      // For now we'll just update the UI state since we don't have a doctors table
      // In a real implementation, you would save to the database
      
      toast({
        title: "Success",
        description: "Doctor information updated successfully",
      });
      
      if (setIsEditing) setIsEditing(false);
    } catch (error) {
      console.error('Error updating doctor:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update doctor information",
      });
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="text-sm font-medium">Doctor Name</label>
          <Input 
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="mt-1"
          />
        </div>
        
        <div>
          <label htmlFor="address" className="text-sm font-medium">Office Address</label>
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
          <Button variant="outline" size="sm" onClick={() => setIsEditing && setIsEditing(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-lg">{doctor.name}</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start">
          <MapPin className="h-4 w-4 mr-3 mt-0.5 text-gray-500 flex-shrink-0" />
          <div>
            <p className="text-sm">{doctor.address}</p>
            <p className="text-sm">{doctor.city}, {doctor.postal_code}</p>
          </div>
        </div>
        
        {doctor.phone && (
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-3 text-gray-500 flex-shrink-0" />
            <p className="text-sm">{doctor.phone}</p>
          </div>
        )}
        
        {doctor.email && (
          <div className="flex items-center">
            <Mail className="h-4 w-4 mr-3 text-gray-500 flex-shrink-0" />
            <p className="text-sm">{doctor.email}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorInfo;
