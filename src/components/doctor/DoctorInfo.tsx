
import React, { useState, Dispatch, SetStateAction, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface DoctorData {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postal_code?: string;
  phone?: string | null;
  email?: string;
}

interface DoctorInfoProps {
  doctor: DoctorData;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
}

const DoctorInfo: React.FC<DoctorInfoProps> = ({
  doctor,
  isEditing,
  setIsEditing
}) => {
  const [name, setName] = useState(doctor.name || '');
  const [address, setAddress] = useState(doctor.address || '');
  const [city, setCity] = useState(doctor.city || '');
  const [postalCode, setPostalCode] = useState(doctor.postal_code || '');
  const [phone, setPhone] = useState(doctor.phone || '');
  const [email, setEmail] = useState(doctor.email || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Update state when doctor prop changes
  useEffect(() => {
    setName(doctor.name || '');
    setAddress(doctor.address || '');
    setCity(doctor.city || '');
    setPostalCode(doctor.postal_code || '');
    setPhone(doctor.phone || '');
    setEmail(doctor.email || '');
  }, [doctor]);

  const handleSave = async () => {
    if (!doctor.id) return;
    
    try {
      setIsSaving(true);
      
      // First update the doctor metadata
      const { error: metadataError } = await supabase
        .from('doctor_metadata')
        .upsert({
          doctor_id: doctor.id,
          updated_at: new Date().toISOString()
        }, { onConflict: 'doctor_id' });
        
      if (metadataError) {
        console.error('Error updating doctor metadata:', metadataError);
        throw metadataError;
      }
      
      // Then update the profile information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          city: city,
          updated_at: new Date().toISOString()
        })
        .eq('id', doctor.id);
        
      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }
      
      toast({
        title: "Success",
        description: "Doctor information updated successfully",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving doctor info:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update doctor information",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. Jane Doe"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+123 456 7890"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Medical St."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Luxembourg"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input
              id="postalCode"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="L-1234"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setIsEditing(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-gray-500">Name</dt>
          <dd className="mt-1 text-sm">{name || 'Not set'}</dd>
        </div>
        
        <div>
          <dt className="text-sm font-medium text-gray-500">Email</dt>
          <dd className="mt-1 text-sm">{email || 'Not set'}</dd>
        </div>
        
        <div>
          <dt className="text-sm font-medium text-gray-500">Phone</dt>
          <dd className="mt-1 text-sm">{phone || 'Not set'}</dd>
        </div>
        
        <div>
          <dt className="text-sm font-medium text-gray-500">Address</dt>
          <dd className="mt-1 text-sm">{address || 'Not set'}</dd>
        </div>
        
        <div>
          <dt className="text-sm font-medium text-gray-500">City</dt>
          <dd className="mt-1 text-sm">{city || 'Not set'}</dd>
        </div>
        
        <div>
          <dt className="text-sm font-medium text-gray-500">Postal Code</dt>
          <dd className="mt-1 text-sm">{postalCode || 'Not set'}</dd>
        </div>
      </dl>
    </div>
  );
};

export default DoctorInfo;
