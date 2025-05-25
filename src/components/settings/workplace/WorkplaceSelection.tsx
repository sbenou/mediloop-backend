
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, MapPin, Phone, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { updateUserTenantName } from "@/utils/tenancy";

interface Workplace {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone?: string;
  hours?: string;
  workplace_type: string;
  description?: string;
}

interface WorkplaceSelectionProps {
  userId: string;
  userRole: string;
  redirectAfterSelection?: boolean;
  onComplete?: () => void;
}

const WorkplaceSelection: React.FC<WorkplaceSelectionProps> = ({
  userId,
  userRole,
  redirectAfterSelection = false,
  onComplete
}) => {
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch workplaces or pharmacies based on user role
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoading(true);
        
        if (userRole === 'doctor') {
          const { data, error } = await supabase
            .from('workplaces')
            .select('*')
            .order('name');
          
          if (error) {
            console.error('Error fetching workplaces:', error);
            toast({
              title: "Error",
              description: "Failed to load workplaces",
              variant: "destructive",
            });
            return;
          }
          
          setWorkplaces(data || []);
        } else if (userRole === 'pharmacist') {
          const { data, error } = await supabase
            .from('pharmacies')
            .select('*')
            .order('name');
          
          if (error) {
            console.error('Error fetching pharmacies:', error);
            toast({
              title: "Error",
              description: "Failed to load pharmacies",
              variant: "destructive",
            });
            return;
          }
          
          setPharmacies(data || []);
        }
      } catch (error) {
        console.error('Error in fetchOptions:', error);
        toast({
          title: "Error",
          description: "Failed to load options",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOptions();
  }, [userRole, toast]);

  const handleSubmit = async () => {
    if (!selectedId) {
      toast({
        title: "Selection Required",
        description: `Please select a ${userRole === 'doctor' ? 'workplace' : 'pharmacy'}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (userRole === 'doctor') {
        // Link doctor to workplace
        const { error } = await supabase
          .from('doctor_workplaces')
          .upsert({
            user_id: userId,
            workplace_id: selectedId,
            is_primary: true
          });

        if (error) {
          console.error('Error linking doctor to workplace:', error);
          throw error;
        }

        // Update tenant name with workplace name
        const selectedWorkplace = workplaces.find(w => w.id === selectedId);
        if (selectedWorkplace) {
          await updateUserTenantName(userId, selectedWorkplace.name);
        }

        toast({
          title: "Success",
          description: "Workplace selection saved successfully",
        });
      } else if (userRole === 'pharmacist') {
        // Link pharmacist to pharmacy
        const { error } = await supabase
          .from('user_pharmacies')
          .upsert({
            user_id: userId,
            pharmacy_id: selectedId
          });

        if (error) {
          console.error('Error linking pharmacist to pharmacy:', error);
          throw error;
        }

        // Update tenant name with pharmacy name
        const selectedPharmacy = pharmacies.find(p => p.id === selectedId);
        if (selectedPharmacy) {
          await updateUserTenantName(userId, undefined, selectedPharmacy.name);
        }

        toast({
          title: "Success",
          description: "Pharmacy selection saved successfully",
        });
      }

      // Call completion callback
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error saving selection:', error);
      toast({
        title: "Error",
        description: "Failed to save selection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading options...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const options = userRole === 'doctor' ? workplaces : pharmacies;
  const optionType = userRole === 'doctor' ? 'workplace' : 'pharmacy';

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-5 w-5" />
          <span>Select Your {userRole === 'doctor' ? 'Workplace' : 'Pharmacy'}</span>
        </CardTitle>
        <CardDescription>
          Choose the {optionType} where you work to complete your registration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {userRole === 'doctor' ? 'Workplace' : 'Pharmacy'}
          </label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder={`Select a ${optionType}...`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.name}</span>
                    <span className="text-sm text-gray-500">
                      {option.city || option.address}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedId && (
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              {(() => {
                const selected = options.find(o => o.id === selectedId);
                if (!selected) return null;
                
                return (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{selected.name}</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{selected.address}, {selected.city}</span>
                      </div>
                      {selected.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{selected.phone}</span>
                        </div>
                      )}
                      {selected.hours && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{selected.hours}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        <Button 
          onClick={handleSubmit} 
          disabled={!selectedId || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Complete Registration'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default WorkplaceSelection;
