
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import ProfessionalImageUpload from "../../pharmacy/profile/ProfessionalImageUpload";

interface ProfileData {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string | null;
  hours: string | null;
  logo_url?: string | null;
}

interface DoctorProfileContentProps {
  doctorData: ProfileData;
  userId?: string;
  onLogoUpdate: (newLogoUrl: string) => void;
}

const DoctorProfileContent: React.FC<DoctorProfileContentProps> = ({
  doctorData,
  userId,
  onLogoUpdate
}) => {
  const [formData, setFormData] = useState({
    name: doctorData.name || "",
    address: doctorData.address || "",
    city: doctorData.city || "",
    postal_code: doctorData.postal_code || "",
    phone: doctorData.phone || "",
    hours: doctorData.hours || ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      if (userId) {
        // Update the profile data
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.name
          })
          .eq('id', userId);
      
        if (error) throw error;
      }
      
      toast({
        title: "Profile Updated",
        description: "Your doctor profile has been updated successfully.",
      });
      
    } catch (error: any) {
      console.error('Error updating doctor profile:', error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Doctor Profile Image</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfessionalImageUpload 
            entityId={doctorData.id}
            entityType="doctor"
            logoUrl={doctorData.logo_url} 
            onImageUpdate={onLogoUpdate}
            userId={userId}
          />
        </CardContent>
      </Card>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Doctor Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Doctor Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  value={formData.phone || ''} 
                  onChange={handleChange}
                  placeholder="+352 123 456 789"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Office Address</Label>
              <Input 
                id="address" 
                name="address" 
                value={formData.address} 
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  name="city" 
                  value={formData.city} 
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input 
                  id="postal_code" 
                  name="postal_code" 
                  value={formData.postal_code} 
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input 
                  id="country" 
                  value="Luxembourg" 
                  disabled
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hours">Consultation Hours</Label>
              <Textarea 
                id="hours" 
                name="hours" 
                value={formData.hours || ''} 
                onChange={handleChange}
                placeholder="Monday to Friday: 9:00 - 17:00&#10;Saturday: 10:00 - 13:00&#10;Sunday: Closed"
                rows={5}
              />
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default DoctorProfileContent;
