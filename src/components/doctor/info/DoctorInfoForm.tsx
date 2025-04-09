
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DoctorInfoFormProps {
  doctor: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    postal_code?: string;
    phone?: string | null;
    email?: string;
  };
  isSubmitting: boolean;
  onCancel: () => void;
  onSave: (formData: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
    email: string;
  }) => void;
}

export const DoctorInfoForm: React.FC<DoctorInfoFormProps> = ({
  doctor,
  isSubmitting,
  onCancel,
  onSave
}) => {
  const [name, setName] = useState(doctor.name || '');
  const [address, setAddress] = useState(doctor.address || '');
  const [city, setCity] = useState(doctor.city || '');
  const [postalCode, setPostalCode] = useState(doctor.postal_code || '');
  const [phone, setPhone] = useState(doctor.phone || '');
  const [email, setEmail] = useState(doctor.email || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      address,
      city,
      postalCode,
      phone,
      email
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          onClick={onCancel}
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
};
