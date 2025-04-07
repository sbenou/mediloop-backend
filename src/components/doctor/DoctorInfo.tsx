
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface DoctorInfoProps {
  doctor: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    postal_code?: string;
    phone?: string | null;
    email?: string;
  };
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
}

const DoctorInfo = ({ doctor, isEditing, setIsEditing }: DoctorInfoProps) => {
  const [name, setName] = useState(doctor.name || '');
  const [address, setAddress] = useState(doctor.address || '');
  const [city, setCity] = useState(doctor.city || '');
  const [postalCode, setPostalCode] = useState(doctor.postal_code || '');
  const [phone, setPhone] = useState(doctor.phone || '');
  const [email, setEmail] = useState(doctor.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Update local state when doctor prop changes
    setName(doctor.name || '');
    setAddress(doctor.address || '');
    setCity(doctor.city || '');
    setPostalCode(doctor.postal_code || '');
    setPhone(doctor.phone || '');
    setEmail(doctor.email || '');
  }, [doctor]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Saving doctor info for ID:', doctor.id);

      // First, update the profile with basic info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          phone_number: phone,
        })
        .eq('id', doctor.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }
      
      console.log('Profile updated successfully, now updating doctor_metadata');

      // Then, update or create doctor_metadata with address info
      const { data: metadataResult, error: metadataError } = await supabase
        .from('doctor_metadata')
        .upsert({
          doctor_id: doctor.id,
          address: address,
          city: city,
          postal_code: postalCode,
        }, {
          onConflict: 'doctor_id'
        });

      if (metadataError) {
        console.error('Error updating doctor_metadata:', metadataError);
        throw metadataError;
      }

      console.log('Doctor metadata updated successfully:', metadataResult);

      toast({
        title: "Success",
        description: "Doctor information updated successfully"
      });
      
      // Force a page refresh to show the updated information
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating doctor info:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update doctor information"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Doctor/Practice Name"
            required
          />
        </div>
        
        <div>
          <label htmlFor="address" className="block text-sm font-medium mb-1">Address</label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street Address"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium mb-1">City</label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
            />
          </div>
          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium mb-1">Postal Code</label>
            <Input
              id="postalCode"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="Postal Code"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone</label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Contact Phone"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <Input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            disabled
          />
        </div>
        
        <div className="flex justify-end space-x-2 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsEditing(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{doctor.name}</h3>
        {doctor.email && (
          <p className="text-sm text-muted-foreground">{doctor.email}</p>
        )}
      </div>
      
      <div className="space-y-2 text-sm">
        {doctor.address && (
          <p>{doctor.address}</p>
        )}
        {(doctor.city || doctor.postal_code) && (
          <p>
            {doctor.city}
            {doctor.city && doctor.postal_code && ", "}
            {doctor.postal_code}
          </p>
        )}
        
        {doctor.phone && (
          <p className="pt-2">
            <span className="font-medium">Phone:</span> {doctor.phone}
          </p>
        )}
      </div>
      
      {(!doctor.address && !doctor.city && !doctor.postal_code && !doctor.phone) && (
        <p className="text-sm text-muted-foreground italic">
          No contact information available. Click edit to add details.
        </p>
      )}
    </div>
  );
};

export default DoctorInfo;
